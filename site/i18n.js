// UI strings. Indonesian is the default; add a language by adding a key here.
export const STRINGS = {
  id: {
    title: 'Buka Link dari Video',
    subtitle: 'Di TikTok, ketuk Bagikan → Salin tautan, lalu tempel di sini.',
    placeholder: 'Tempel link TikTok, mis. https://vt.tiktok.com/…',
    paste: 'Tempel',
    submit: 'Tampilkan Link',
    loading: 'Mencari…',
    resultLabel: 'Link dari video ini:',
    open: 'Buka',
    copy: 'Salin',
    copied: 'Tersalin!',
    premiumLabel: 'Kode premium kamu:',
    premiumHint: 'Kode premium hanya muncul jika kamu menempel link hasil “Salin tautan”.',
    errEmpty: 'Tempel link TikTok dulu, ya.',
    errNotTiktok: 'Itu bukan link TikTok. Salin link dari tombol Bagikan di video.',
    errInvalid: 'Format link tidak dikenali. Salin ulang dari tombol Bagikan → Salin tautan.',
    errExpired: 'Link tidak bisa dibuka atau sudah kedaluwarsa. Salin ulang dari video, lalu coba lagi.',
    errNoLink: 'Video ini belum punya link. Pastikan kamu menyalin link dari video yang benar.',
    errNetwork: 'Koneksi bermasalah. Cek internet kamu, lalu coba lagi.',
    errPastePermission: 'Browser tidak mengizinkan tempel otomatis. Tekan lama kolom di atas, lalu pilih Tempel.',
    errCopy: 'Gagal menyalin. Tekan lama link di atas untuk menyalin.',
    langSwitch: 'English',
  },
  en: {
    title: 'Reveal the Link from the Video',
    subtitle: 'In TikTok, tap Share → Copy link, then paste it here.',
    placeholder: 'Paste a TikTok link, e.g. https://vt.tiktok.com/…',
    paste: 'Paste',
    submit: 'Show Link',
    loading: 'Looking up…',
    resultLabel: 'Link from this video:',
    open: 'Open',
    copy: 'Copy',
    copied: 'Copied!',
    premiumLabel: 'Your premium code:',
    premiumHint: 'The premium code only appears when you paste a link from “Copy link”.',
    errEmpty: 'Paste a TikTok link first.',
    errNotTiktok: "That isn't a TikTok link. Copy the link from the video's Share button.",
    errInvalid: "We don't recognise that link. Copy it again from Share → Copy link.",
    errExpired: "That link can't be opened or has expired. Copy it again from the video and retry.",
    errNoLink: "This video doesn't have a link. Make sure you copied the right video.",
    errNetwork: 'Connection problem. Check your internet and try again.',
    errPastePermission: "Your browser blocked auto-paste. Long-press the box above and choose Paste.",
    errCopy: "Couldn't copy. Long-press the link above to copy it.",
    langSwitch: 'Bahasa Indonesia',
  },
};

export function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && STRINGS[q]) return q;
  return 'id';
}
