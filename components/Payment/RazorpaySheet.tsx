// components/Payment/RazorpaySheet.tsx
// WebView-based Razorpay checkout — Expo Go compatible
// Usage: <RazorpaySheet visible={true} orderData={...} userInfo={...} onSuccess={...} onDismiss={...} />

import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
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
  onFailed?:  (error: string) => void;
};

// ✅ Razorpay checkout HTML — inline mein inject karte hain
function buildRazorpayHtml(order: RazorpayOrderData, user: RazorpayUserInfo): string {
  const amountInRupees = (order.amount / 100).toFixed(2);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <title>Payment</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
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
    .loader {
      text-align: center;
      color: #fff;
    }
    .loader .spinner {
      width: 48px; height: 48px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top: 4px solid #0A84FF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loader p { color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 600; }
    .amount { color: #fff; font-size: 28px; font-weight: 900; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <div class="amount">₹${amountInRupees}</div>
    <p>Opening payment...</p>
  </div>

  <script>
    var options = {
      key:         "${order.keyId}",
      amount:      "${order.amount}",
      currency:    "${order.currency}",
      name:        "${order.eventTitle || "Event Payment"}",
      description: "${order.description || `Pay ₹${amountInRupees} to join`}",
      order_id:    "${order.orderId}",
      prefill: {
        name:    "${user.name}",
        email:   "${user.email}",
        contact: "${user.phone || ""}",
      },
      theme: {
        color: "#0A84FF",
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "RAZORPAY_DISMISSED"
          }));
        }
      },
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:    "RAZORPAY_SUCCESS",
          payload: {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_signature:  response.razorpay_signature,
          }
        }));
      }
    };

    // Auto-open Razorpay after 800ms (page load hone do)
    setTimeout(function() {
      try {
        var rzp = new Razorpay(options);
        rzp.on("payment.failed", function(resp) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type:   "RAZORPAY_FAILED",
            error:  resp.error.description || "Payment failed",
            code:   resp.error.code,
          }));
        });
        rzp.open();
      } catch(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:  "RAZORPAY_FAILED",
          error: e.message || "Could not open payment gateway",
        }));
      }
    }, 800);
  </script>
</body>
</html>
  `.trim();
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

  const html = buildRazorpayHtml(orderData, userInfo);

  function handleMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === "RAZORPAY_SUCCESS") {
        onSuccess(msg.payload as RazorpaySuccessPayload);
      } else if (msg.type === "RAZORPAY_DISMISSED") {
        onDismiss();
      } else if (msg.type === "RAZORPAY_FAILED") {
        const errMsg = msg.error || "Payment failed. Please try again.";
        onFailed?.(errMsg);
      }
    } catch {
      // ignore parse errors
    }
  }

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
            ref={webViewRef}
            source={{ html, baseUrl: "https://checkout.razorpay.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            onLoad={() => setLoading(false)}
            onMessage={handleMessage}
            style={styles.webView}
            // Allow all mixed content for Razorpay
            mixedContentMode="always"
            // Android pe hardware acceleration
            androidHardwareAccelerationDisabled={false}
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