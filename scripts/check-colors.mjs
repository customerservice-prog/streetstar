// StreetStar palette contrast guard, using WCAG 2.2 relative luminance math.
// This validates defined color pairs, not every rendered pixel or page state.
const palette = {
  background: "#090d11",
  surface: "#161c22",
  card: "#1b2127",
  headline: "#f4f6f1",
  body: "#bdcad0",
  secondary: "#aebcc5",
  lime: "#d7fc56",
  ink: "#10170c",
  lavender: "#c4acfa",
  placeholder: "#95a4ac"
};

function luminance(hex) {
  const channels = [1,3,5].map(n => parseInt(hex.slice(n,n+2),16)/255);
  const linear = channels.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground),luminance(background)].sort((a,b) => b-a);
  return (lighter + .05) / (darker + .05);
}
const pairs = [
  ["headline / background","headline","background"],
  ["headline / surface","headline","surface"],
  ["body / background","body","background"],
  ["body / surface","body","surface"],
  ["secondary / card","secondary","card"],
  ["lime / background","lime","background"],
  ["lime / surface","lime","surface"],
  ["ink / lime CTA","ink","lime"],
  ["lavender / background","lavender","background"],
  ["placeholder / card","placeholder","card"],
];
let failure = false;
console.log("StreetStar palette contrast audit (WCAG AA 4.5:1 for normal text)");
for (const [label,foreground,background] of pairs) {
  const ratio = contrast(palette[foreground],palette[background]);
  const pass = ratio >= 4.5;
  console.log((pass ? "PASS" : "FAIL") + " | " + ratio.toFixed(2) + ":1 | " + label);
  if (!pass) failure = true;
}
if (failure) process.exitCode = 1;
