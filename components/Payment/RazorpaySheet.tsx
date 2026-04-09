// components/Payment/RazorpaySheet.tsx
// WebView-based Razorpay checkout — Expo Go compatible
// Fixed: ERR|STEP_UNKNOWN — better script loading, retry, error handling

import React, { useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";

export type RazorpayOrderData = {
  orderId:  string;
  amount:   number;   // paise mein
  currency: string;
  keyId:    string;
  eventTitle?: string;
  description?: string;
};

export type RazorpayUserInfo = {
  name:  string;
  email: string;
  phone?: string;
};

export type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
};

type Props = {
  visible:    boolean;
  orderData:  RazorpayOrderData;
  userInfo:   RazorpayUserInfo;
  onSuccess:  (payload: RazorpaySuccessPayload) => void;
  onDismiss:  () => void;
  onFailed?:  (error: string, details?: any) => void;
  prefillMethod?: string;
};

// ✅ Razorpay HTML — fetches checkout.js inline, retries if needed
function buildRazorpayHtml(order: RazorpayOrderData, user: RazorpayUserInfo): string {
  const amountInRupees = (order.amount / 100).toFixed(2);

  const keyJS          = JSON.stringify(order.keyId);
  const orderIdJS      = JSON.stringify(order.orderId);
  const currencyJS     = JSON.stringify(order.currency);
  const nameJS         = JSON.stringify(order.eventTitle || "Event Payment");
  const descriptionJS  = JSON.stringify(order.description || `Pay ₹${amountInRupees}`);
  const userNameJS     = JSON.stringify(user.name || "User");
  const userEmailJS    = JSON.stringify(user.email || "");
  const userPhoneJS    = JSON.stringify(user.phone || "");
  const amountJS       = order.amount;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>Secure Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0B0B12;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    #status {
      text-align: center;
      color: #fff;
      padding: 20px;
    }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top: 4px solid #0A84FF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .amount { color: #fff; font-size: 28px; font-weight: 900; margin-bottom: 8px; }
    .msg { color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 600; }
    .err { color: #ff6b6b; font-size: 13px; margin-top: 12px; }
  </style>
</head>
<body>
  <div id="status">
    <div class="spinner"></div>
    <div class="amount">₹${amountInRupees}</div>
    <p class="msg" id="msg">Loading payment gateway...</p>
    <p class="err" id="err"></p>
  </div>

  <script>
    // ── Bridge console to React Native ──
    (function() {
      var origLog = console.log;
      var origErr = console.error;
      var origWarn = console.warn;
      function bridge(level, args) {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "CONSOLE_LOG", level: level,
            message: Array.from(args).map(function(a) {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            }).join(' ')
          }));
        } catch(e) {}
      }
      console.log  = function() { bridge('log',  arguments); origLog.apply(console, arguments); };
      console.error = function() { bridge('error', arguments); origErr.apply(console, arguments); };
      console.warn  = function() { bridge('warn',  arguments); origWarn.apply(console, arguments); };
    })();

    function setMsg(text) {
      var el = document.getElementById('msg');
      if (el) el.textContent = text;
    }
    function setErr(text) {
      var el = document.getElementById('err');
      if (el) el.textContent = text;
    }

    // ── Global error catcher ──
    window.onerror = function(msg, src, line, col, err) {
      console.error('GlobalError', msg, 'line:', line);
      sendFailed('JS Error: ' + msg);
      return true;
    };

    function sendFailed(errMsg, code, step, reason) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'RAZORPAY_FAILED',
        error: errMsg || 'Payment failed',
        details: (code || 'ERR') + ' | ' + (step || 'STEP_UNKNOWN') + ' | ' + (reason || 'unknown')
      }));
    }

    // ── Load Razorpay script dynamically ──
    var loadAttempts = 0;
    var maxAttempts = 3;
    var rzpLoaded = false;

    function loadRazorpayScript(cb) {
      loadAttempts++;
      console.log('Loading Razorpay SDK, attempt', loadAttempts);
      setMsg('Loading payment SDK... (' + loadAttempts + '/' + maxAttempts + ')');

      var script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = function() {
        console.log('Razorpay SDK loaded successfully');
        rzpLoaded = true;
        cb(null);
      };
      script.onerror = function(e) {
        console.error('Failed to load Razorpay SDK:', e);
        if (loadAttempts < maxAttempts) {
          setTimeout(function() { loadRazorpayScript(cb); }, 2000);
        } else {
          cb(new Error('Could not load Razorpay. Check internet connection.'));
        }
      };
      document.head.appendChild(script);
    }

    function startPayment() {
      if (typeof Razorpay === 'undefined') {
        console.error('Razorpay still not available after script load');
        setErr('Payment SDK failed to initialize.');
        sendFailed('Razorpay SDK not available');
        return;
      }

      setMsg('Opening Razorpay...');
      console.log('Initializing Razorpay with orderId:', ${orderIdJS});

      var options = {
        key:         ${keyJS},
        amount:      ${amountJS},
        currency:    ${currencyJS},
        name:        ${nameJS},
        description: ${descriptionJS},
        order_id:    ${orderIdJS},
        prefill: {
          name:    ${userNameJS},
          email:   ${userEmailJS},
          contact: ${userPhoneJS}
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: 'Pay via UPI',
                instruments: [
                  { method: 'upi' },
                ]
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ]
              }
            },
            sequence: ['block.utib', 'block.other'],
            preferences: {
              show_default_blocks: false
            }
          }
        },
        theme: { color: '#0A84FF', hide_topbar: false },
        modal: {
          escape: true,
          backdropclose: false,
          confirm_close: false,
          ondismiss: function() {
            console.log('Razorpay modal dismissed');
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'RAZORPAY_DISMISSED'
            }));
          }
        },
        handler: function(response) {
          console.log('Payment SUCCESS:', response.razorpay_payment_id);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'RAZORPAY_SUCCESS',
            payload: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature
            }
          }));
        }
      };

      try {
        var rzp = new Razorpay(options);

        rzp.on('payment.failed', function(resp) {
          var e = resp.error || {};
          console.error('Payment FAILED:', JSON.stringify(e));
          sendFailed(
            e.description || e.reason || 'Payment failed. Please try again.',
            e.code,
            e.step,
            e.reason
          );
        });

        rzp.open();
        console.log('Razorpay modal opened');

        // Notify RN that modal is open
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'RAZORPAY_READY'
        }));
      } catch(e) {
        console.error('Razorpay init/open error:', e.message);
        setErr('Error: ' + e.message);
        sendFailed('Initialization error: ' + e.message);
      }
    }

    // ── Start ──
    window.addEventListener('load', function() {
      loadRazorpayScript(function(err) {
        if (err) {
          setErr(err.message);
          sendFailed(err.message);
          return;
        }
        // Small delay to ensure SDK is fully ready
        setTimeout(startPayment, 500);
      });
    });
  </script>
</body>
</html>`.trim();
}

export default function RazorpaySheet({
  visible,
  orderData,
  userInfo,
  onSuccess,
  onDismiss,
  onFailed,
}: Props) {
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);

  const html = buildRazorpayHtml(orderData, userInfo);

  const handleMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === "CONSOLE_LOG") {
        const logFn = msg.level === "error" ? console.error : msg.level === "warn" ? console.warn : console.log;
        logFn(`[RZP-WebView]`, msg.message);
        return;
      }

      switch (msg.type) {
        case "RAZORPAY_READY":
          setLoading(false);
          break;
        case "RAZORPAY_SUCCESS":
          setLoading(false);
          onSuccess(msg.payload as RazorpaySuccessPayload);
          break;
        case "RAZORPAY_DISMISSED":
          onDismiss();
          break;
        case "RAZORPAY_FAILED":
          setLoading(false);
          const errMsg = msg.error || "Payment failed. Please try again.";
          onFailed?.(errMsg, msg.details);
          break;
      }
    } catch {
      // ignore parse errors
    }
  }, [onSuccess, onDismiss, onFailed]);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("[RazorpaySheet] WebView error:", nativeEvent);
    onFailed?.("WebView failed to load. Check internet connection.", nativeEvent?.description);
  }, [onFailed]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={14} color="#4ADE80" />
            </View>
            <Text style={styles.headerTitle}>Secure Payment</Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={12}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Amount pill */}
        <View style={styles.amountBar}>
          <Text style={styles.amountLabel}>Paying</Text>
          <Text style={styles.amountValue}>
            ₹{(orderData.amount / 100).toFixed(0)}
          </Text>
          <Text style={styles.amountSub}>
            {orderData.eventTitle || "Event"}
          </Text>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#0A84FF" />
              <Text style={styles.loaderText}>Loading payment gateway...</Text>
            </View>
          )}
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={{ html, baseUrl: "https://checkout.razorpay.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleMessage}
            onError={handleError}
            onHttpError={(e) => {
              console.warn("[RazorpaySheet] HTTP Error:", e.nativeEvent.statusCode, e.nativeEvent.url);
            }}
            onLoadEnd={() => {
              // Fallback: if RAZORPAY_READY doesn't come in 8s, hide loader
              setTimeout(() => setLoading(false), 8000);
            }}
            style={styles.webView}
            mixedContentMode="always"
            androidHardwareAccelerationDisabled={false}
            // Allow third-party cookies needed by Razorpay
            thirdPartyCookiesEnabled
            // Allow all URLs (needed for Razorpay redirects like UPI deep links)
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => {
              // Allow Razorpay URLs and deep links
              return true;
            }}
          />
        </View>

        {/* Security footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.3)" />
          <Text style={styles.footerText}>
            256-bit SSL encrypted • Powered by Razorpay
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B12",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(74,222,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.2)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  amountBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  amountLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "700",
  },
  amountValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  amountSub: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },

  webViewContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "#0B0B12",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0B12",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 14,
  },
  loaderText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerText: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 11,
    fontWeight: "700",
  },
});