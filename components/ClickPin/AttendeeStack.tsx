import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "./PersonBookingSheet.style";

type Props = {
  visible: boolean;
  apiBase?: string;
  apiKey?: string;
  attendeeIds: string[];
};

function pickPhoto(u: any) {
  return (
    u?.profile?.photos?.[0] ||
    u?.profile?.photoUrl ||
    u?.profile?.avatarUrl ||
    u?.avatarUrl ||
    u?.imageUrl ||
    ""
  );
}

function initials(u: any) {
  const f = (u?.profile?.firstName || "").trim();
  const l = (u?.profile?.lastName || "").trim();
  const a = f ? f[0] : "";
  const b = l ? l[0] : "";
  const s = (a + b).toUpperCase();
  return s || "";
}

export default function AttendeeStack({ visible, apiBase, apiKey, attendeeIds }: Props) {
  const topIds = useMemo(() => attendeeIds.slice(0, 5), [attendeeIds]);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !apiBase) return;

    if (!topIds.length) {
      setUsers([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const fetched = await Promise.all(
          topIds.map(async (cid) => {
            try {
              const res = await fetch(`${apiBase}/api/users/get-user?clerkUserId=${encodeURIComponent(cid)}`, {
                headers: apiKey ? { "x-api-key": apiKey } : undefined,
              });
              const json = await res.json().catch(() => null);
              return res.ok ? json?.user ?? null : null;
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) setUsers(fetched.filter(Boolean));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, apiBase, apiKey, topIds.join("|")]);

  const total = attendeeIds.length;
  const extra = total > 5 ? total - 5 : 0;

  // ✅ show "10+" when extras are large
  const extraText = extra >= 10 ? "10+" : extra > 0 ? `+${extra}` : "";

  return (
    <View style={styles.attendeeRow}>
      {loading ? (
        <View style={styles.attendeeLeft}>
          <ActivityIndicator size="small" />
          <Text style={styles.attendeeText}>Loading attendees…</Text>
        </View>
      ) : (
        <View style={styles.attendeeLeft}>
          <View style={styles.avatarStack}>
            {users.map((u, i) => {
              const uri = pickPhoto(u);
              const key = u?.clerkUserId || u?._id || String(i);

              return (
                <View key={key} style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.avatarImg} />
                  ) : initials(u) ? (
                    <View style={styles.avatarInitials}>
                      <Text style={styles.avatarInitialsText}>{initials(u)}</Text>
                    </View>
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Ionicons name="person" size={14} color="#166534" />
                    </View>
                  )}
                </View>
              );
            })}

            {extraText ? (
              <View style={[styles.avatarWrap, styles.avatarMore, { marginLeft: users.length ? -10 : 0 }]}>
                <Text style={styles.avatarMoreText}>{extraText}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.attendeeText}>
            {total ? `${total} attending` : "No attendees yet"}
          </Text>
        </View>
      )}
    </View>
  );
}
