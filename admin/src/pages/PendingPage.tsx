import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { StatusDot } from '../components/StatusDot';

export function PendingPage() {
  const { user, refresh } = useAuth();
  const [city, setCity] = useState(user?.location?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  async function saveLocation() {
    if (!city.trim()) return;
    setSaving(true);
    try {
      // Geocode via Open-Meteo's free geocoding endpoint, then store coords.
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      ).then((r) => r.json());

      const result = geo.results?.[0];
      if (!result) {
        alert('City not found, try a different spelling.');
        return;
      }

      await api.patch('/users/me/location', {
        name: `${result.name}, ${result.country}`,
        lat: result.latitude,
        lon: result.longitude,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function connectTelegram() {
    const { data } = await api.post('/users/me/telegram/link-token');
    setLink(data.deepLink);
    window.open(data.deepLink, '_blank');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-panel border border-border rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-lg font-semibold">Your Access Request</h1>
          {user && <StatusDot status={user.status} />}
        </div>

        {user?.status === 'pending' && (
          <p className="text-sm text-muted mb-6">
            An admin needs to approve your request before alerts go live. You
            can finish setup now so you're ready the moment you're approved.
          </p>
        )}
        {user?.status === 'rejected' && (
          <p className="text-sm text-red mb-6">
            Your access request was declined. Contact an admin if you believe
            this is a mistake.
          </p>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-xs text-muted mb-2">Alert location</label>
            <div className="flex gap-2">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kanpur"
                className="flex-1 rounded-md bg-bg border border-border px-3 py-2 text-sm focus:outline-none focus:border-cyan/50"
              />
              <button
                onClick={saveLocation}
                disabled={saving}
                className="rounded-md bg-cyan/10 text-cyan px-4 py-2 text-sm font-medium hover:bg-cyan/20 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {user?.location && (
              <p className="text-xs text-cyan mt-2">Set to {user.location.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-muted mb-2">Telegram</label>
            {user?.telegramChatId ? (
              <p className="text-sm text-cyan">Telegram connected ✓</p>
            ) : (
              <button
                onClick={connectTelegram}
                className="w-full rounded-md border border-border py-2 text-sm font-medium hover:border-cyan/40 hover:text-cyan transition-colors"
              >
                Connect Telegram
              </button>
            )}
            {link && !user?.telegramChatId && (
              <p className="text-xs text-muted mt-2">
                Opened in a new tab. Tap "Start" in Telegram to finish linking.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
