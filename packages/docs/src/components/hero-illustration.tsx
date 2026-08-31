/**
 * Front-page pipeline illustration: components + functions merge into one
 * prompt, the model streams entries, and entries land in an app built only
 * from the supplied shapes. All geometry is `currentColor` (inherits the
 * page's muted foreground); the accent rides `--uicast-hero-accent`, set per
 * theme in globals.css. Authored in Claude Design, adapted to the docs theme.
 */
export function HeroIllustration() {
  return (
    <svg
      className="uicast-hero"
      viewBox="0 0 1180 420"
      role="img"
      aria-label="A pipeline: your components and functions merge into one prompt, an AI streams entries as JSON lines, and the entries render into a complete app built from those same components."
    >
      <rect className="uh-box" x="30" y="48" width="206" height="140" rx="10"></rect>
      <rect className="uh-tile" x="44" y="62" width="84" height="54" rx="7"></rect>
      <rect className="uh-tile" x="138" y="62" width="84" height="54" rx="7"></rect>
      <rect className="uh-tile" x="44" y="124" width="84" height="52" rx="7"></rect>
      <rect className="uh-tile" x="138" y="124" width="84" height="52" rx="7"></rect>
      <rect className="uh-a" x="62" y="81" width="48" height="15" rx="7.5"></rect>
      <text className="uh-hint" x="120" y="75" textAnchor="end">{'{}'}</text>
      <rect className="uh-s" strokeOpacity=".35" x="152" y="76" width="56" height="32" rx="4"></rect>
      <rect className="uh-f" fillOpacity=".12" x="157" y="81" width="17" height="22" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".3" x="179" y="83" width="22" height="5" rx="2.5"></rect>
      <rect className="uh-f" fillOpacity=".18" x="179" y="92" width="16" height="5" rx="2.5"></rect>
      <text className="uh-hint" x="214" y="73" textAnchor="end">{'{}'}</text>
      <path className="uh-s" strokeOpacity=".2" d="M60 168 H118"></path>
      <rect className="uh-f" fillOpacity=".3" x="66" y="156" width="8" height="12" rx="1.5"></rect>
      <rect className="uh-f" fillOpacity=".3" x="80" y="148" width="8" height="20" rx="1.5"></rect>
      <rect className="uh-f" fillOpacity=".3" x="94" y="152" width="8" height="16" rx="1.5"></rect>
      <rect className="uh-a" x="108" y="140" width="8" height="28" rx="1.5"></rect>
      <text className="uh-hint" x="120" y="136" textAnchor="end">{'{}'}</text>
      <rect className="uh-s" strokeOpacity=".35" x="152" y="136" width="56" height="32" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".12" x="152" y="136" width="56" height="9" rx="3"></rect>
      <path className="uh-s" strokeOpacity=".25" d="M152 145 H208 M152 156 H208 M171 136 V168 M190 136 V168"></path>
      <text className="uh-hint" x="214" y="133" textAnchor="end">{'{}'}</text>
      <text className="uh-lb" x="133" y="207" textAnchor="middle">COMPONENTS</text>
      <rect className="uh-box" x="30" y="226" width="206" height="104" rx="10"></rect>
      <text className="uh-a" x="46" y="257" fontFamily="ui-monospace,Menlo,monospace" fontStyle="italic" fontSize="13" fontWeight="600">ƒ</text>
      <rect className="uh-f" fillOpacity=".28" x="64" y="248" width="60" height="8" rx="4"></rect>
      <path className="uh-s" strokeOpacity=".4" d="M134 252 H150 M146 248.5 L150 252 L146 255.5"></path>
      <rect className="uh-as" strokeOpacity=".8" x="158" y="245.5" width="28" height="13" rx="4"></rect>
      <circle className="uh-a" cx="167" cy="252" r="2"></circle>
      <text className="uh-a" x="46" y="285" fontFamily="ui-monospace,Menlo,monospace" fontStyle="italic" fontSize="13" fontWeight="600">ƒ</text>
      <rect className="uh-f" fillOpacity=".28" x="64" y="276" width="46" height="8" rx="4"></rect>
      <path className="uh-s" strokeOpacity=".4" d="M134 280 H150 M146 276.5 L150 280 L146 283.5"></path>
      <rect className="uh-as" strokeOpacity=".8" x="158" y="273.5" width="28" height="13" rx="4"></rect>
      <circle className="uh-a" cx="167" cy="280" r="2"></circle>
      <text className="uh-a" x="46" y="313" fontFamily="ui-monospace,Menlo,monospace" fontStyle="italic" fontSize="13" fontWeight="600">ƒ</text>
      <rect className="uh-f" fillOpacity=".28" x="64" y="304" width="54" height="8" rx="4"></rect>
      <path className="uh-s" strokeOpacity=".4" d="M134 308 H150 M146 304.5 L150 308 L146 311.5"></path>
      <rect className="uh-as" strokeOpacity=".8" x="158" y="301.5" width="28" height="13" rx="4"></rect>
      <circle className="uh-a" cx="167" cy="308" r="2"></circle>
      <text className="uh-lb" x="133" y="349" textAnchor="middle">FUNCTIONS</text>
      <path className="uh-s" strokeOpacity=".3" strokeWidth="1.5" d="M236 118 C272 118 270 190 302 196"></path>
      <path className="uh-s" strokeOpacity=".3" strokeWidth="1.5" d="M236 278 C272 278 270 212 302 206"></path>
      <path className="uh-f" fillOpacity=".03" stroke="currentColor" strokeOpacity=".35" d="M310 156 h36 l18 18 v66 a6 6 0 0 1 -6 6 h-48 a6 6 0 0 1 -6 -6 v-78 a6 6 0 0 1 6 -6 z"></path>
      <path className="uh-f" fillOpacity=".08" d="M346 156 l18 18 h-18 z"></path>
      <path className="uh-s" strokeOpacity=".35" d="M346 156 v18 h18"></path>
      <rect className="uh-f" fillOpacity=".22" x="314" y="186" width="30" height="4" rx="2"></rect>
      <rect className="uh-a" fillOpacity=".85" x="314" y="196" width="40" height="4" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".22" x="314" y="206" width="36" height="4" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".22" x="314" y="216" width="40" height="4" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".22" x="314" y="226" width="24" height="4" rx="2"></rect>
      <text className="uh-lb" x="334" y="268" textAnchor="middle">PROMPT</text>
      <path className="uh-s" strokeOpacity=".3" strokeWidth="1.5" d="M372 202 H392"></path>
      <path className="uh-f" fillOpacity=".3" d="M400 202 l-8 -4.5 v9 z"></path>
      <circle className="uh-s" strokeOpacity=".18" cx="446" cy="202" r="38"></circle>
      <circle className="uh-s" strokeOpacity=".4" cx="446" cy="202" r="25" strokeDasharray="3 6"></circle>
      <path className="uh-a" d="M446 186 C448.5 196 452 199.5 462 202 C452 204.5 448.5 208 446 218 C443.5 208 440 204.5 430 202 C440 199.5 443.5 196 446 186 Z"></path>
      <circle className="uh-f" fillOpacity=".3" cx="473" cy="175" r="2"></circle>
      <circle className="uh-f" fillOpacity=".3" cx="419" cy="229" r="2"></circle>
      <rect className="uh-box" x="528" y="154" width="90" height="96" rx="8"></rect>
      <text className="uh-hint" x="542" y="175.5">{'{'}</text>
      <rect className="uh-a" fillOpacity=".8" x="550" y="170" width="8" height="3.5" rx="1.75"></rect>
      <rect className="uh-f" fillOpacity=".3" x="562" y="170" width="30" height="3.5" rx="1.75"></rect>
      <text className="uh-hint" x="598" y="175.5">{'}'}</text>
      <text className="uh-hint" x="542" y="194.5">{'{'}</text>
      <rect className="uh-a" fillOpacity=".8" x="550" y="189" width="8" height="3.5" rx="1.75"></rect>
      <rect className="uh-f" fillOpacity=".3" x="562" y="189" width="36" height="3.5" rx="1.75"></rect>
      <text className="uh-hint" x="604" y="194.5">{'}'}</text>
      <text className="uh-hint" x="542" y="213.5">{'{'}</text>
      <rect className="uh-a" fillOpacity=".8" x="550" y="208" width="8" height="3.5" rx="1.75"></rect>
      <rect className="uh-f" fillOpacity=".3" x="562" y="208" width="26" height="3.5" rx="1.75"></rect>
      <text className="uh-hint" x="594" y="213.5">{'}'}</text>
      <g opacity=".6">
      <text className="uh-hint" x="542" y="232.5">{'{'}</text>
      <rect className="uh-a" fillOpacity=".8" x="550" y="227" width="8" height="3.5" rx="1.75"></rect>
      <rect className="uh-a" fillOpacity=".5" x="562" y="224" width="5" height="10" rx="1"></rect>
      </g>
      <text className="uh-lb" x="573" y="268" textAnchor="middle">ENTRIES</text>
      <path className="uh-s" strokeOpacity=".3" strokeWidth="1.5" d="M492 202 H512"></path>
      <path className="uh-f" fillOpacity=".3" d="M520 202 l-8 -4.5 v9 z"></path>
      <path className="uh-s" strokeOpacity=".3" strokeWidth="1.5" d="M626 202 H646"></path>
      <path className="uh-f" fillOpacity=".3" d="M654 202 l-8 -4.5 v9 z"></path>
      <path className="uh-s" strokeOpacity=".25" strokeDasharray="3 4" d="M236 118 H646"></path>
      <path className="uh-f" fillOpacity=".3" d="M654 118 l-8 -4.5 v9 z"></path>
      <path className="uh-s" strokeOpacity=".25" strokeDasharray="3 4" d="M236 278 H646"></path>
      <path className="uh-f" fillOpacity=".3" d="M654 278 l-8 -4.5 v9 z"></path>
      <rect className="uh-box" x="662" y="44" width="488" height="330" rx="12" strokeWidth="1.5"></rect>
      <path className="uh-s" strokeOpacity=".18" d="M662 76 H1150"></path>
      <circle className="uh-f" fillOpacity=".22" cx="682" cy="60" r="3.5"></circle>
      <circle className="uh-f" fillOpacity=".22" cx="696" cy="60" r="3.5"></circle>
      <circle className="uh-f" fillOpacity=".22" cx="710" cy="60" r="3.5"></circle>
      <rect className="uh-f" fillOpacity=".06" x="826" y="53" width="160" height="14" rx="7"></rect>
      <path className="uh-s" strokeOpacity=".15" d="M750 76 V374"></path>
      <rect className="uh-a" x="674" y="94" width="54" height="8" rx="4"></rect>
      <rect className="uh-f" fillOpacity=".18" x="674" y="112" width="46" height="8" rx="4"></rect>
      <rect className="uh-f" fillOpacity=".18" x="674" y="130" width="50" height="8" rx="4"></rect>
      <rect className="uh-f" fillOpacity=".18" x="674" y="148" width="40" height="8" rx="4"></rect>
      <rect className="uh-f" fillOpacity=".4" x="766" y="92" width="100" height="10" rx="4"></rect>
      <rect className="uh-as" strokeOpacity=".5" x="1032" y="88" width="46" height="17" rx="8.5"></rect>
      <rect className="uh-a" x="1090" y="88" width="46" height="17" rx="8.5"></rect>
      <rect className="uh-s" strokeOpacity=".18" x="766" y="122" width="176" height="102" rx="8"></rect>
      <path className="uh-s" strokeOpacity=".15" d="M780 210 H928"></path>
      <rect className="uh-f" fillOpacity=".28" x="790" y="188" width="11" height="22" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".28" x="817" y="176" width="11" height="34" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".28" x="844" y="184" width="11" height="26" rx="2"></rect>
      <rect className="uh-a" x="871" y="160" width="11" height="50" rx="2"></rect>
      <rect className="uh-f" fillOpacity=".28" x="898" y="170" width="11" height="40" rx="2"></rect>
      <rect className="uh-s" strokeOpacity=".18" x="954" y="122" width="182" height="102" rx="8"></rect>
      <rect className="uh-f" fillOpacity=".08" x="968" y="136" width="42" height="42" rx="5"></rect>
      <rect className="uh-f" fillOpacity=".32" x="1020" y="140" width="80" height="7" rx="3.5"></rect>
      <rect className="uh-f" fillOpacity=".18" x="1020" y="154" width="60" height="7" rx="3.5"></rect>
      <rect className="uh-f" fillOpacity=".18" x="1020" y="168" width="70" height="7" rx="3.5"></rect>
      <rect className="uh-as" strokeOpacity=".7" x="1020" y="192" width="42" height="15" rx="7.5"></rect>
      <rect className="uh-s" strokeOpacity=".18" x="766" y="238" width="370" height="118" rx="8"></rect>
      <path className="uh-s" strokeOpacity=".18" d="M766 264 H1136"></path>
      <rect className="uh-f" fillOpacity=".32" x="782" y="248" width="50" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".32" x="906" y="248" width="50" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".32" x="1030" y="248" width="50" height="6" rx="3"></rect>
      <path className="uh-s" strokeOpacity=".08" d="M894 238 V356 M1018 238 V356"></path>
      <path className="uh-s" strokeOpacity=".1" d="M766 288 H1136 M766 311 H1136 M766 334 H1136"></path>
      <rect className="uh-f" fillOpacity=".18" x="782" y="272" width="64" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".18" x="782" y="295" width="56" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".18" x="782" y="318" width="68" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".18" x="782" y="341" width="52" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".12" x="906" y="272" width="44" height="6" rx="3"></rect>
      <rect className="uh-f" fillOpacity=".12" x="906" y="318" width="44" height="6" rx="3"></rect>
      <rect className="uh-ac" fillOpacity=".16" strokeOpacity=".5" x="1030" y="270" width="32" height="11" rx="5.5"></rect>
      <rect className="uh-f" fillOpacity=".12" x="1030" y="293" width="32" height="11" rx="5.5"></rect>
      <rect className="uh-ac" fillOpacity=".16" strokeOpacity=".5" x="1030" y="316" width="32" height="11" rx="5.5"></rect>
      <rect className="uh-f" fillOpacity=".12" x="1030" y="339" width="32" height="11" rx="5.5"></rect>
      <text className="uh-lb" x="906" y="398" textAnchor="middle">APP</text>
    </svg>
  );
}
