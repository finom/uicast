// The page's state and view model, kept from the approved Design canvas (~/Work/random/uicast-landing).
// `renderVals()` returns everything the view reads; `setState` re-renders through `listener`.
import { KEY_TIPS } from "@/lib/key-tips";

class DCLogic {
  constructor(props) {
    this.props = props;
    this.state = {};
    this.listener = null;
  }

  setState(update) {
    this.state = Object.assign({}, this.state, typeof update === 'function' ? update(this.state) : update);
    if (this.listener) this.listener();
  }
}

export class LandingLogic extends DCLogic {
  constructor(props) {
    super(props);
    this.state = Object.assign(
      {
        lens: 'user',
        theme: 'soft',
        screen: 'bill',
        // Until the first cast runs, the window waits with an empty prompt.
        cast: { key: 'bill', typed: 0, thinking: true, n: 0, waiting: true },
        seen: {},
        fn: null,
        chat: [],
        nextId: 0,
        chatBuild: null,
        docOpen: {},
        confirm: null,
        faqOpen: { 0: true },
        copied: null,
      },
      this.fresh('bill'),
      this.fresh('trip'),
      this.fresh('habits'),
      this.fresh('orders'),
      this.freshChat(),
    );
  }

  // The first cast starts when the stage scrolls into view.
  componentDidMount() {
    const go = () => {
      if (this.started) return;
      this.started = true;
      if (this.watch) this.watch.disconnect();
      this.cast('bill');
    };
    // The first chat answer is written once the phone is in view, like the screen above.
    const firstAnswer = () => {
      if (this.chatWatch) this.chatWatch.disconnect();
      if (!this.state.chat.length && !this.state.chatBuild) this.ask('coffee');
    };
    const stage = typeof document !== 'undefined' && document.getElementById('cast-window');
    const phone = typeof document !== 'undefined' && document.getElementById('chat-phone');
    if (stage && phone && typeof IntersectionObserver !== 'undefined') {
      // Start once the top of the element is in view. A ratio alone fails on a phone, where the window is taller than the screen.
      const enough = (e) => e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= 240);
      const steps = [];
      for (let i = 0; i <= 35; i += 1) steps.push(i / 100);
      this.watch = new IntersectionObserver((seen) => seen.some(enough) && go(), { threshold: steps });
      this.watch.observe(stage);
      this.chatWatch = new IntersectionObserver((seen) => seen.some(enough) && firstAnswer(), { threshold: steps });
      this.chatWatch.observe(phone);
    } else {
      this.start = setTimeout(go, 600);
      this.chatStart = setTimeout(firstAnswer, 600);
    }
  }

  componentWillUnmount() {
    if (this.watch) this.watch.disconnect();
    if (this.chatWatch) this.chatWatch.disconnect();
    clearTimeout(this.start);
    clearTimeout(this.chatStart);
    clearInterval(this.timer);
    clearInterval(this.chatTimer);
    clearTimeout(this.burstTimer);
  }

  // Each screen starts from the data its seed step would load.
  fresh(key) {
    if (key === 'bill') {
      return {
        bill: {
          tip: 15,
          sent: false,
          items: [
            { name: 'Margherita pizza', emoji: '🍕', price: 18, who: ['Ana', 'Ben', 'Cleo', 'Dev'] },
            { name: 'Truffle fries', emoji: '🍟', price: 9, who: ['Ana', 'Ben'] },
            { name: 'Burrata', emoji: '🧀', price: 14, who: ['Cleo', 'Dev'] },
            { name: 'Two lemonades', emoji: '🍋', price: 8, who: ['Ana', 'Cleo'] },
            { name: 'Tiramisu', emoji: '🍰', price: 8, who: ['Ben'] },
            { name: 'House red', emoji: '🍷', price: 30, who: ['Ben', 'Cleo', 'Dev'] },
          ],
        },
      };
    }
    if (key === 'trip') {
      return { trip: { budget: 400, stay: 'guest', day: 'Sat', picked: ['pasteis', 'tram', 'fado', 'sintra', 'sunset'], saved: false } };
    }
    if (key === 'habits') {
      return {
        habits: {
          added: [],
          done: { water: [0, 1, 2, 3], read: [0, 2, 3], move: [1, 3], stretch: [0, 1, 2, 3], phone: [2] },
        },
      };
    }
    return {
      orders: {
        q: '',
        tab: 'toship',
        sel: {},
        note: null,
        list: [
          { id: 2041, customer: 'Mira Chen', city: 'Leeds', placed: 'Mon', age: 4, total: 412, status: 'toship' },
          { id: 2042, customer: 'Jonas Weber', city: 'Berlin', placed: 'Mon', age: 4, total: 356.5, status: 'toship' },
          { id: 2043, customer: 'Priya Nair', city: 'Pune', placed: 'Tue', age: 3, total: 516, status: 'shipped' },
          { id: 2044, customer: 'Tom Okafor', city: 'Lagos', placed: 'Tue', age: 3, total: 289.9, status: 'toship' },
          { id: 2045, customer: 'Lena Ruiz', city: 'Madrid', placed: 'Wed', age: 2, total: 74, status: 'shipped' },
          { id: 2046, customer: 'Sam Ito', city: 'Osaka', placed: 'Wed', age: 2, total: 198.4, status: 'toship' },
          { id: 2047, customer: 'Nora Blake', city: 'Dublin', placed: 'Thu', age: 1, total: 640, status: 'toship' },
          { id: 2048, customer: 'Ivan Petrov', city: 'Sofia', placed: 'Thu', age: 1, total: 129, status: 'shipped' },
        ],
      },
    };
  }

  freshChat() {
    return {
      coffee: { limit: 4.5, compare: true },
      lunch: { vote: null, booked: null },
      water: { days: ['Mon', 'Thu'], time: '19:00', saved: false },
      refund: { reason: null, share: 1, done: null },
    };
  }

  // ---------- data ----------

  reqs() {
    return {
      bill: { icon: '🍕', tag: 'Fintech app', color: 'var(--l-coral)', soft: 'var(--l-coral-soft)', text: 'Split tonight’s dinner between the four of us, with a tip' },
      trip: { icon: '✈️', tag: 'Travel app', color: 'var(--l-blue)', soft: 'var(--l-blue-soft)', text: 'Plan a weekend in Lisbon for two, under €400' },
      habits: { icon: '🌱', tag: 'Wellness app', color: 'var(--l-green)', soft: 'var(--l-green-soft)', text: 'Show my habits this week and let me check off today' },
      orders: { icon: '📦', tag: 'Back office', color: 'var(--l-violet)', soft: 'var(--l-violet-soft)', text: 'Which orders still need shipping? Let me ship them' },
    };
  }

  people() {
    return [
      { name: 'Ana', color: '#FF6B4A' },
      { name: 'Ben', color: '#2E8BE6' },
      { name: 'Cleo', color: '#1F9E7E' },
      { name: 'Dev', color: '#E39B00' },
    ];
  }

  tripData() {
    return {
      stays: [
        { id: 'hostel', emoji: '🛏️', label: 'Hostel', night: 55 },
        { id: 'guest', emoji: '🏡', label: 'Guesthouse', night: 95 },
        { id: 'boutique', emoji: '✨', label: 'Boutique hotel', night: 150 },
      ],
      acts: [
        { id: 'pasteis', day: 'Sat', start: 9.5, end: 10.5, time: '09:30–10:30', emoji: '🥐', name: 'Pastéis de Belém', cost: 8 },
        { id: 'tram', day: 'Sat', start: 11, end: 12.5, time: '11:00–12:30', emoji: '🚋', name: 'Tram 28 across Alfama', cost: 6 },
        { id: 'ocean', day: 'Sat', start: 14, end: 16, time: '14:00–16:00', emoji: '🐠', name: 'Oceanário', cost: 50 },
        { id: 'lx', day: 'Sat', start: 16.5, end: 18, time: '16:30–18:00', emoji: '🛍️', name: 'LX Factory', cost: 0 },
        { id: 'fado', day: 'Sat', start: 20.5, end: 23, time: '20:30–23:00', emoji: '🎶', name: 'Fado dinner', cost: 90 },
        { id: 'sintra', day: 'Sun', start: 9, end: 18, time: '09:00–18:00', emoji: '🏰', name: 'Day trip to Sintra', cost: 40 },
        { id: 'surf', day: 'Sun', start: 10, end: 12, time: '10:00–12:00', emoji: '🏄', name: 'Surf lesson', cost: 110 },
        { id: 'market', day: 'Sun', start: 13, end: 14, time: '13:00–14:00', emoji: '🍤', name: 'Lunch at Time Out Market', cost: 36 },
        { id: 'sunset', day: 'Sun', start: 19.5, end: 20.5, time: '19:30–20:30', emoji: '🌅', name: 'Sunset at Senhora do Monte', cost: 0 },
      ],
    };
  }

  habitList() {
    const base = [
      { id: 'water', icon: '💧', name: 'Drink 2 L of water' },
      { id: 'read', icon: '📚', name: 'Read 20 minutes' },
      { id: 'move', icon: '🏃', name: 'Move 30 minutes' },
      { id: 'stretch', icon: '🧘', name: 'Stretch' },
      { id: 'phone', icon: '📵', name: 'No phone after 10 pm' },
    ];
    return base.concat(this.habitIdeas().filter((h) => this.state.habits.added.indexOf(h.id) >= 0));
  }

  habitIdeas() {
    return [
      { id: 'veg', icon: '🥦', name: 'Eat a vegetable' },
      { id: 'journal', icon: '✍️', name: 'Journal 5 minutes' },
      { id: 'sleep', icon: '😴', name: 'In bed by 11' },
    ];
  }

  coffeeDays() {
    return {
      now: [4.2, 3.8, 0, 5.1, 4.2, 6.4, 0, 4.2, 3.8, 4.6, 5.9, 0, 4.2, 7.2, 4.2, 0, 3.8, 4.6, 5.1, 4.2, 0, 6.6, 4.2, 3.8, 0, 4.6, 5.1, 8.3],
      prev: [3.8, 0, 4.2, 3.8, 0, 5.1, 0, 4.2, 3.8, 0, 4.6, 3.8, 0, 6.2, 3.8, 4.2, 0, 3.8, 4.6, 0, 0, 4.2, 3.8, 4.2, 0, 5.1, 3.8, 6.4],
    };
  }

  lunchVotes() {
    return [
      { time: '12:00', who: ['Ana', 'Ben'] },
      { time: '12:30', who: ['Cleo', 'Dev', 'Eli'] },
      { time: '13:00', who: ['Fay'] },
    ];
  }

  // ---------- documents (what the model wrote) ----------

  // Built once: the documents never change.
  docs() {
    if (!this.docsCache) this.docsCache = this.buildDocs();
    return this.docsCache;
  }

  // Each line is tokenized once.
  line(e) {
    if (!this.lineCache) this.lineCache = new Map();
    let segs = this.lineCache.get(e);
    if (!segs) {
      segs = this.tokens(JSON.stringify(this.plain(e)));
      this.lineCache.set(e, segs);
    }
    return segs;
  }

  buildDocs() {
    const R = 'scopes.root';
    const sub = R + '.bill.items.reduce((s, i) => s + i.price, 0)';
    const share =
      R + '.bill.items.filter((i) => i.who.includes(scopes.p)).reduce((s, i) => s + i.price / i.who.length, 0) * (1 + ' + R + '.tip / 100)';
    const tripCost =
      R + '.trip.stays.find((s) => s.id === ' + R + '.stay).night * 2 + ' + R + '.trip.acts.filter((a) => ' + R + '.picked.includes(a.id)).reduce((s, a) => s + a.cost, 0)';
    const clash =
      R + '.trip.acts.filter((a) => ' + R + '.picked.includes(a.id)).some((a, i, all) => all.some((b, j) => j > i && a.day === b.day && a.start < b.end && b.start < a.end))';
    const streak =
      '(scopes.h.done.includes(' + R + '.today) ? 1 : 0) + ' + R + '.days.slice(0, ' + R + '.today).map((_, d) => scopes.h.done.includes(d)).toReversed().concat(false).indexOf(false)';
    const atRisk = R + '.habits.filter((h) => !h.done.includes(' + R + '.today) && h.done.includes(' + R + '.today - 1) && h.done.includes(' + R + '.today - 2))';
    const doneSoFar = R + '.habits.reduce((s, h) => s + h.done.filter((d) => d <= ' + R + '.today).length, 0)';
    const shown =
      R + ".orders.filter((o) => (" + R + ".tab === 'all' || o.status === " + R + '.tab) && (o.customer + o.city + o.id).toLowerCase().includes(' + R + '.q.toLowerCase()))';
    const picked = R + ".orders.filter((o) => " + R + ".sel[o.id] && o.status === 'toship')";
    const week = (list, w) => R + '.spend.' + list + '.slice(' + w + ' * 7, ' + w + ' * 7 + 7).reduce((s, d) => s + d, 0)';
    return {
      bill: [
        { p: 1, key: 'root', component: 'FlexCol', props: { literal: { gap: '4' } }, seed: [{ set: R + '.bill', expr: 'getBill({ table: 12 })' }, { set: R + '.people', literal: ['Ana', 'Ben', 'Cleo', 'Dev'] }, { set: R + '.tip', literal: 15 }, { set: R + '.sent', literal: false }], children: ['title', 'sub', 'stats', 'items', 'tip-card', 'people', 'send', 'note'] },
        { p: 1, key: 'title', component: 'Heading', props: { expr: "({ text: 'Dinner at ' + " + R + ".bill.place, level: '3' })" } },
        { p: 1, key: 'sub', component: 'Typography', props: { expr: "({ variant: 'muted', text: 'Table 12 · ' + " + R + ".bill.items.length + ' items · paid by Ana' })" } },
        { p: 1, key: 'stats', component: 'Grid', props: { literal: { columns: '3', gap: '3' } }, children: ['s-sub', 's-tip', 's-total'] },
        { p: 1, key: 's-sub', component: 'Stat', props: { expr: "({ label: 'Subtotal', value: '$' + " + sub + '.toFixed(2) })' } },
        { p: 1, key: 's-tip', component: 'Stat', props: { expr: "({ label: 'Tip ' + " + R + ".tip + '%', value: '$' + (" + sub + ' * ' + R + ".tip / 100).toFixed(2) })" } },
        { p: 1, key: 's-total', component: 'Stat', props: { expr: "({ label: 'Total', value: '$' + (" + sub + ' * (1 + ' + R + ".tip / 100)).toFixed(2) })" } },
        { p: 2, key: 'items', component: 'Card', props: { literal: { title: 'Who had what', description: 'Tap a name to add or remove them' } }, children: ['item'] },
        { p: 2, key: 'item', component: 'FlexRow', each: R + '.bill.items', as: 'i', keyBy: 'name', props: { literal: { align: 'center', gap: '3', wrap: true } }, children: ['item-name', 'item-who', 'item-each'] },
        { p: 2, key: 'item-name', component: 'Typography', props: { expr: "({ text: scopes.i.emoji + ' ' + scopes.i.name + ' · $' + scopes.i.price })" } },
        { p: 2, key: 'item-who', component: 'ToggleGroup', props: { expr: "({ type: 'multiple', value: scopes.i.who, items: " + R + '.people.map((p) => ({ value: p, label: p })) })' }, callbacks: { onChange: [{ set: 'scopes.i.who', expr: 'evt.value' }] } },
        { p: 2, key: 'item-each', component: 'Typography', props: { expr: "({ variant: 'muted', text: scopes.i.who.length ? '÷ ' + scopes.i.who.length + ' = $' + (scopes.i.price / scopes.i.who.length).toFixed(2) + ' each' : 'Nobody picked yet' })" } },
        { p: 3, key: 'tip-card', component: 'Card', props: { expr: "({ title: 'Tip', description: " + R + ".tip + '% · $' + (" + sub + ' * ' + R + ".tip / 100).toFixed(2) })" }, children: ['tip', 'tip-quick'] },
        { p: 3, key: 'tip', component: 'Slider', props: { expr: '({ value: ' + R + '.tip, min: 0, max: 25, step: 1, showValue: true })' }, callbacks: { onChange: [{ set: R + '.tip', expr: 'evt.value' }] } },
        { p: 3, key: 'tip-quick', component: 'ToggleGroup', props: { expr: '({ value: String(' + R + ".tip), items: ['10', '15', '20'].map((v) => ({ value: v, label: v + '%' })) })" }, callbacks: { onChange: [{ set: R + '.tip', expr: 'Number(evt.value)' }] } },
        { p: 4, key: 'people', component: 'Grid', props: { literal: { columns: '4', gap: '3' } }, children: ['person'] },
        { p: 4, key: 'person', component: 'Stat', each: R + '.people', as: 'p', props: { expr: "({ label: scopes.p === 'Ana' ? 'Ana (you)' : scopes.p, value: '$' + (" + share + ").toFixed(2), helpText: " + R + ".bill.items.filter((i) => i.who.includes(scopes.p)).length + ' items' })" } },
        { p: 5, key: 'send', component: 'Button', props: { expr: "({ text: 'Send payment requests', disabled: " + R + '.sent || ' + R + '.bill.items.some((i) => i.who.length === 0) })' }, callbacks: { onClick: [{ expr: 'requestPayments({ requests: ' + R + ".people.filter((p) => p !== 'Ana').map((p) => ({ name: p, amount: Math.round((" + share + ') * 100) / 100 })) })' }, { set: R + '.sent', literal: true }] } },
        { p: 5, key: 'note', component: 'Typography', props: { expr: '({ text: ' + R + ".bill.items.some((i) => i.who.length === 0) ? 'Pick who had the ' + " + R + ".bill.items.filter((i) => i.who.length === 0).map((i) => i.name.toLowerCase()).join(' and ') + ' first.' : " + R + ".sent ? 'Sent: ' + " + R + ".people.filter((p) => p !== 'Ana').map((p) => p + ' $' + (" + share + ").toFixed(2)).join(', ') + '.' : 'Ana paid. Ben, Cleo and Dev get a request for their share.' })" } },
      ],
      trip: [
        { p: 1, key: 'root', component: 'FlexCol', props: { literal: { gap: '4' } }, seed: [{ set: R + '.trip', expr: "getTripOptions({ city: 'Lisbon', nights: 2, people: 2 })" }, { set: R + '.budget', literal: 400 }, { set: R + '.stay', literal: 'guest' }, { set: R + '.day', literal: 'Sat' }, { set: R + '.picked', literal: ['pasteis', 'tram', 'fado', 'sintra', 'sunset'] }, { set: R + '.saved', literal: false }], children: ['title', 'sub', 'left', 'meter', 'budget', 'stay', 'acts-card', 'plan', 'save', 'note'] },
        { p: 1, key: 'title', component: 'Heading', props: { literal: { text: 'A weekend in Lisbon', level: '3' } } },
        { p: 1, key: 'sub', component: 'Typography', props: { literal: { variant: 'muted', text: 'Saturday and Sunday · prices for two' } } },
        { p: 1, key: 'left', component: 'Stat', props: { expr: "({ label: 'Budget', value: " + R + '.budget >= ' + tripCost + " ? '€' + (" + R + '.budget - (' + tripCost + ")) + ' left' : '€' + (" + tripCost + ' - ' + R + ".budget) + ' over' })" } },
        { p: 1, key: 'meter', component: 'ProgressBar', props: { expr: '({ value: ' + tripCost + ', max: ' + R + ".budget, label: '€' + (" + tripCost + ") + ' of €' + " + R + ".budget, showLabel: true, color: " + tripCost + ' > ' + R + ".budget ? 'error' : " + tripCost + ' > ' + R + ".budget * 0.9 ? 'warning' : 'success' })" } },
        { p: 1, key: 'budget', component: 'Slider', props: { expr: '({ value: ' + R + '.budget, min: 250, max: 700, step: 10 })' }, callbacks: { onChange: [{ set: R + '.budget', expr: 'evt.value' }] } },
        { p: 2, key: 'stay', component: 'ToggleGroup', props: { expr: '({ value: ' + R + '.stay, items: ' + R + ".trip.stays.map((s) => ({ value: s.id, label: s.label + ' · €' + s.night + ' a night' })) })" }, callbacks: { onChange: [{ set: R + '.stay', expr: 'evt.value' }] } },
        { p: 3, key: 'acts-card', component: 'Card', props: { literal: { title: 'Things to do' } }, children: ['day', 'act', 'clash'] },
        { p: 3, key: 'day', component: 'ToggleGroup', props: { expr: '({ value: ' + R + ".day, items: [{ value: 'Sat', label: 'Saturday' }, { value: 'Sun', label: 'Sunday' }] })" }, callbacks: { onChange: [{ set: R + '.day', expr: 'evt.value' }] } },
        { p: 3, key: 'act', component: 'Checkbox', each: R + '.trip.acts.filter((a) => a.day === ' + R + '.day)', as: 'a', keyBy: 'id', props: { expr: '({ checked: ' + R + ".picked.includes(scopes.a.id), label: scopes.a.emoji + ' ' + scopes.a.name + ' · ' + scopes.a.time + ' · ' + (scopes.a.cost ? '€' + scopes.a.cost : 'free') })" }, callbacks: { onChange: [{ set: R + '.picked', expr: 'evt.checked ? [...currentValue, scopes.a.id] : currentValue.filter((id) => id !== scopes.a.id)' }] } },
        { p: 3, key: 'clash', component: 'Alert', hidden: '!(' + clash + ')', props: { expr: "({ status: 'warning', title: " + R + '.trip.acts.filter((a) => ' + R + ".picked.includes(a.id)).filter((a, i, all) => all.some((b, j) => j !== i && a.day === b.day && a.start < b.end && b.start < a.end)).map((a) => a.name).join(' and ') + ' overlap.' })" } },
        { p: 4, key: 'plan', component: 'List', props: { expr: '({ items: ' + R + '.trip.acts.filter((a) => ' + R + ".picked.includes(a.id)).toSorted((a, b) => a.day === b.day ? a.start - b.start : a.day === 'Sat' ? -1 : 1).map((a) => a.day + ' ' + a.time.slice(0, 5) + ' ' + a.emoji + ' ' + a.name) })" } },
        { p: 5, key: 'save', component: 'Button', props: { expr: "({ text: " + R + ".saved ? 'Saved ✓' : 'Save the plan', disabled: " + R + '.saved || ' + tripCost + ' > ' + R + '.budget || ' + clash + ' })' }, callbacks: { onClick: [{ expr: 'savePlan({ stay: ' + R + '.stay, activities: ' + R + '.picked })' }, { set: R + '.saved', literal: true }] } },
        { p: 5, key: 'note', component: 'Typography', props: { expr: '({ text: ' + R + ".saved ? 'Saved: ' + " + R + ".picked.length + ' stops, €' + (" + tripCost + ") + ' for two.' : " + tripCost + ' > ' + R + ".budget ? 'Over budget: drop something or raise the budget.' : " + R + ".picked.length + ' stops · €' + (" + tripCost + ") + ' for two' })" } },
      ],
      habits: [
        { p: 1, key: 'root', component: 'FlexCol', props: { literal: { gap: '4' } }, seed: [{ set: R + '.habits', expr: "getHabits({ week: 'current' })" }, { set: R + '.days', literal: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }, { set: R + '.today', literal: 4 }], children: ['title', 'ring', 'message', 'today', 'week', 'ideas-label', 'ideas'] },
        { p: 1, key: 'title', component: 'Heading', props: { literal: { text: 'This week', level: '3' } } },
        { p: 1, key: 'ring', component: 'GaugeChart', props: { expr: '({ value: Math.round(' + doneSoFar + ' / (' + R + '.habits.length * (' + R + ".today + 1)) * 100), label: 'this week', height: 160 })" } },
        { p: 1, key: 'message', component: 'Typography', props: { expr: "({ variant: 'lead', text: " + R + '.habits.every((h) => h.done.includes(' + R + ".today)) ? 'Today: all ' + " + R + ".habits.length + ' done. Nice week.' : 'Today: ' + " + R + '.habits.filter((h) => h.done.includes(' + R + ".today)).length + ' of ' + " + R + ".habits.length + ' done.' + (" + atRisk + ".length ? ' Keep these streaks going: ' + " + atRisk + ".map((h) => h.icon).join(' ') : '') })" } },
        { p: 2, key: 'today', component: 'Grid', props: { literal: { columns: '3', gap: '2' } }, children: ['check'] },
        { p: 2, key: 'check', component: 'Button', each: R + '.habits', as: 'h', keyBy: 'id', props: { expr: "({ text: scopes.h.icon + ' ' + scopes.h.name, variant: scopes.h.done.includes(" + R + ".today) ? 'default' : 'outline' })" }, callbacks: { onClick: [{ set: 'scopes.h.done', expr: 'currentValue.includes(' + R + '.today) ? currentValue.filter((d) => d !== ' + R + '.today) : [...currentValue, ' + R + '.today]' }, { expr: 'setHabitDay({ id: scopes.h.id, day: ' + R + '.today, done: scopes.h.done.includes(' + R + '.today) })' }] } },
        { p: 3, key: 'week', component: 'Card', props: { literal: { title: 'Day by day' } }, children: ['row'] },
        { p: 3, key: 'row', component: 'FlexRow', each: R + '.habits', as: 'h', keyBy: 'id', props: { literal: { align: 'center', gap: '3' } }, children: ['row-days', 'row-streak'] },
        { p: 3, key: 'row-days', component: 'ToggleGroup', props: { expr: "({ type: 'multiple', value: scopes.h.done.map(String), items: " + R + '.days.map((d, i) => ({ value: String(i), label: d })) })' }, callbacks: { onChange: [{ set: 'scopes.h.done', expr: 'evt.value.map(Number).filter((d) => d <= ' + R + '.today)' }, { expr: 'setHabitDays({ id: scopes.h.id, days: scopes.h.done })' }] } },
        { p: 3, key: 'row-streak', component: 'Badge', props: { expr: "({ text: '🔥 ' + (" + streak + "), variant: 'secondary' })" } },
        { p: 4, key: 'ideas-label', component: 'Typography', props: { literal: { variant: 'muted', text: 'Add a habit:' } } },
        { p: 4, key: 'ideas', component: 'ButtonGroup', children: ['idea'] },
        { p: 4, key: 'idea', component: 'Button', each: 'getHabitIdeas()', as: 'idea', keyBy: 'id', props: { expr: "({ text: '+ ' + scopes.idea.icon + ' ' + scopes.idea.name, variant: 'outline', size: 'sm' })" }, callbacks: { onClick: [{ expr: 'addHabit({ id: scopes.idea.id })' }, { set: R + '.habits', expr: "getHabits({ week: 'current' })" }] } },
      ],
      orders: [
        { p: 1, key: 'root', component: 'FlexCol', props: { literal: { gap: '4' } }, seed: [{ set: R + '.orders', expr: "listOrders({ since: 'monday' })" }, { set: R + '.q', literal: '' }, { set: R + '.tab', literal: 'toship' }, { set: R + '.sel', literal: {} }, { set: R + '.note', literal: null }], children: ['title', 'sub', 'stats', 'toolbar', 'table', 'bulk', 'note'] },
        { p: 1, key: 'title', component: 'Heading', props: { literal: { text: 'Orders to ship', level: '3' } } },
        { p: 1, key: 'sub', component: 'Typography', props: { literal: { variant: 'muted', text: 'Placed since Monday · a made-up store' } } },
        { p: 1, key: 'stats', component: 'Grid', props: { literal: { columns: '3', gap: '3' } }, children: ['s-count', 's-value', 's-oldest'] },
        { p: 1, key: 's-count', component: 'Stat', props: { expr: "({ label: 'To ship', value: " + R + ".orders.filter((o) => o.status === 'toship').length })" } },
        { p: 1, key: 's-value', component: 'Stat', props: { expr: "({ label: 'Waiting to ship', value: '$' + " + R + ".orders.filter((o) => o.status === 'toship').reduce((s, o) => s + o.total, 0).toFixed(2) })" } },
        { p: 1, key: 's-oldest', component: 'Stat', props: { expr: "({ label: 'Oldest waiting', value: Math.max(0, ..." + R + ".orders.filter((o) => o.status === 'toship').map((o) => o.age)) + ' days' })" } },
        { p: 2, key: 'toolbar', component: 'FlexRow', props: { literal: { gap: '2', wrap: true } }, children: ['search', 'tabs'] },
        { p: 2, key: 'search', component: 'SearchInput', props: { expr: "({ value: " + R + ".q, placeholder: 'Search customer, city or #id' })" }, callbacks: { onChange: [{ set: R + '.q', expr: 'evt.value' }] } },
        { p: 2, key: 'tabs', component: 'ToggleGroup', props: { expr: '({ value: ' + R + ".tab, items: [['toship', 'To ship'], ['shipped', 'Shipped'], ['all', 'All']].map(([v, l]) => ({ value: v, label: l + ' ' + " + R + ".orders.filter((o) => v === 'all' || o.status === v).length })) })" }, callbacks: { onChange: [{ set: R + '.tab', expr: 'evt.value' }] } },
        { p: 3, key: 'table', component: 'Table', children: ['tbody'] },
        { p: 3, key: 'tbody', component: 'TableBody', children: ['row'] },
        { p: 3, key: 'row', component: 'TableRow', each: shown, as: 'o', keyBy: 'id', children: ['c-pick', 'c-customer', 'c-placed', 'c-total', 'c-status', 'c-ship'] },
        { p: 3, key: 'c-pick', component: 'Checkbox', props: { expr: '({ checked: ' + R + ".sel[scopes.o.id] ?? false, disabled: scopes.o.status !== 'toship' })" }, callbacks: { onChange: [{ set: R + '.sel', expr: '({ ...currentValue, [scopes.o.id]: evt.checked })' }] } },
        { p: 3, key: 'c-customer', component: 'TableCell', props: { expr: "({ text: scopes.o.customer + ' · #' + scopes.o.id + ' · ' + scopes.o.city })" } },
        { p: 3, key: 'c-placed', component: 'TableCell', props: { expr: "({ text: scopes.o.placed + ' · ' + scopes.o.age + 'd' })" } },
        { p: 3, key: 'c-total', component: 'TableCell', props: { expr: "({ text: '$' + scopes.o.total.toFixed(2) })" } },
        { p: 3, key: 'c-status', component: 'Badge', props: { expr: "({ text: scopes.o.status === 'toship' ? 'To ship' : 'Shipped', variant: scopes.o.status === 'toship' ? 'default' : 'secondary' })" } },
        { p: 3, key: 'c-ship', component: 'Button', hidden: "scopes.o.status !== 'toship'", props: { literal: { text: 'Ship', size: 'sm', variant: 'outline' } }, callbacks: { onClick: [{ expr: 'shipOrders({ ids: [scopes.o.id] })' }, { set: 'scopes.o.status', literal: 'shipped' }, { set: R + '.note', literal: 'Marked 1 order shipped.' }] } },
        { p: 4, key: 'bulk', component: 'Button', props: { expr: '({ text: ' + picked + ".length ? 'Ship ' + " + picked + ".length + ' selected · $' + " + picked + ".reduce((s, o) => s + o.total, 0).toFixed(2) : 'Select orders to ship', disabled: " + picked + '.length === 0 })' }, callbacks: { onClick: [{ set: R + '.note', expr: "'Marked ' + " + picked + ".length + (" + picked + ".length === 1 ? ' order' : ' orders') + ' shipped.'" }, { expr: 'shipOrders({ ids: ' + picked + '.map((o) => o.id) })' }, { set: R + '.orders', expr: "listOrders({ since: 'monday' })" }, { set: R + '.sel', literal: {} }] } },
        { p: 4, key: 'note', component: 'Typography', props: { expr: '({ text: ' + R + ".note ?? 'Tick a few rows, or ship one at a time.' })" } },
      ],
      coffee: [
        { p: 1, key: 'root', component: 'FlexCol', props: { literal: { gap: '3' } }, seed: [{ set: R + '.spend', expr: "getSpending({ category: 'coffee', days: 28 })" }, { set: R + '.compare', literal: true }, { set: R + '.limit', literal: 4.5 }], children: ['total', 'chart', 'compare', 'limit', 'verdict'] },
        { p: 1, key: 'total', component: 'Stat', props: { expr: "({ label: 'Coffee, last 4 weeks', value: '$' + " + R + ".spend.now.reduce((s, d) => s + d, 0).toFixed(2), trend: 'up', trendValue: '$' + (" + R + '.spend.now.reduce((s, d) => s + d, 0) - ' + R + ".spend.prev.reduce((s, d) => s + d, 0)).toFixed(2) })" } },
        { p: 1, key: 'chart', component: 'BarChart', props: { expr: '({ data: [0, 1, 2, 3].map((w) => ({ week: \'Week \' + (w + 1), Now: ' + week('now', 'w') + ', Before: ' + week('prev', 'w') + ' })), xKey: \'week\', yKeys: ' + R + ".compare ? ['Before', 'Now'] : ['Now'], height: 120 })" } },
        { p: 1, key: 'compare', component: 'Checkbox', props: { expr: "({ checked: " + R + ".compare, label: 'Compare with the 4 weeks before' })" }, callbacks: { onChange: [{ set: R + '.compare', expr: 'evt.checked' }] } },
        { p: 2, key: 'limit', component: 'Slider', props: { expr: '({ value: ' + R + '.limit, min: 2, max: 7, step: 0.5, showValue: true })' }, callbacks: { onChange: [{ set: R + '.limit', expr: 'evt.value' }] } },
        { p: 2, key: 'verdict', component: 'Typography', props: { expr: '({ text: ' + R + '.spend.now.some((d) => d > ' + R + ".limit) ? 'You went over it on ' + " + R + '.spend.now.filter((d) => d > ' + R + ".limit).length + ' of 28 days. Sticking to it would have saved $' + " + R + '.spend.now.reduce((s, d) => s + Math.max(0, d - ' + R + ".limit), 0).toFixed(2) + '.' : 'You never went over $' + " + R + ".limit.toFixed(2) + ' in a day.' })" } },
      ],
      lunch: [
        { p: 1, key: 'root', component: 'Card', props: { literal: { title: 'Lunch on Friday' } }, seed: [{ set: R + '.poll', expr: "getPoll({ id: 'friday-lunch' })" }, { set: R + '.vote', literal: null }, { set: R + '.booked', literal: null }], children: ['option', 'book', 'booked'] },
        { p: 1, key: 'option', component: 'ProgressBar', each: R + '.poll.options', as: 'o', keyBy: 'time', props: { expr: "({ label: scopes.o.time + ' · ' + scopes.o.who.concat(" + R + ".vote === scopes.o.time ? ['You'] : []).join(', '), value: scopes.o.who.length + (" + R + '.vote === scopes.o.time ? 1 : 0), max: 7, showLabel: true })' } },
        { p: 1, key: 'vote', component: 'ToggleGroup', props: { expr: '({ value: ' + R + '.vote ?? undefined, items: ' + R + '.poll.options.map((o) => ({ value: o.time, label: o.time })) })' }, callbacks: { onChange: [{ set: R + '.vote', expr: 'evt.value' }] } },
        { p: 1, key: 'book', component: 'Button', props: { expr: "({ text: " + R + ".booked ? 'Booked ✓' : " + R + ".vote ? 'Book ' + " + R + '.poll.options.toSorted((a, b) => b.who.length + (' + R + '.vote === b.time ? 1 : 0) - a.who.length - (' + R + ".vote === a.time ? 1 : 0))[0].time + ' for 7' : 'Vote to book', disabled: !" + R + '.vote || ' + R + '.booked !== null })' }, callbacks: { onClick: [{ set: R + '.booked', expr: 'bookTable({ day: \'Fri\', time: ' + R + '.poll.options.toSorted((a, b) => b.who.length + (' + R + '.vote === b.time ? 1 : 0) - a.who.length - (' + R + '.vote === a.time ? 1 : 0))[0].time, people: 7 })' }] } },
        { p: 1, key: 'booked', component: 'Alert', hidden: R + '.booked === null', props: { expr: "({ status: 'success', title: 'Booked ' + " + R + ".booked?.place + ', Friday ' + " + R + ".booked?.time + ', table for 7.', description: 'The team got an invite.' })" } },
      ],
      water: [
        { p: 1, key: 'root', component: 'Card', props: { literal: { title: 'Water the plants' } }, seed: [{ set: R + '.days', literal: ['Mon', 'Thu'] }, { set: R + '.time', literal: '19:00' }, { set: R + '.saved', literal: false }], children: ['days', 'time', 'summary', 'save'] },
        { p: 1, key: 'days', component: 'ToggleGroup', props: { expr: "({ type: 'multiple', value: " + R + ".days, items: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({ value: d, label: d })) })" }, callbacks: { onChange: [{ set: R + '.days', expr: 'evt.value' }] } },
        { p: 1, key: 'time', component: 'ToggleGroup', props: { expr: '({ value: ' + R + ".time, items: ['08:00', '13:00', '19:00'].map((t) => ({ value: t, label: t })) })" }, callbacks: { onChange: [{ set: R + '.time', expr: 'evt.value' }] } },
        { p: 1, key: 'summary', component: 'Typography', props: { expr: "({ variant: 'muted', text: " + R + ".days.length ? 'Every ' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((d) => " + R + ".days.includes(d)).join(', ') + ' at ' + " + R + ".time + ' · next: ' + ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].find((d) => " + R + ".days.includes(d)) + ' ' + " + R + ".time : 'Pick at least one day.' })" } },
        { p: 1, key: 'save', component: 'Button', props: { expr: "({ text: " + R + ".saved ? 'Saved ✓ · next on ' + ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].find((d) => " + R + ".days.includes(d)) + ' at ' + " + R + ".time : 'Save reminder', disabled: " + R + '.saved || ' + R + '.days.length === 0 })' }, callbacks: { onClick: [{ expr: "createReminder({ text: 'Water the plants', days: " + R + '.days, time: ' + R + '.time })' }, { set: R + '.saved', literal: true }] } },
      ],
      refund: [
        { p: 1, key: 'root', component: 'Card', props: { literal: { title: 'Order #1042 · Jonas Weber' } }, seed: [{ set: R + '.order', expr: 'getOrder({ id: 1042 })' }, { set: R + '.reason', literal: null }, { set: R + '.share', literal: 1 }], children: ['about', 'reason', 'share', 'go', 'done'] },
        { p: 1, key: 'about', component: 'Typography', props: { expr: "({ variant: 'muted', text: " + R + ".order.items + ' items · paid $' + " + R + ".order.total.toFixed(2) + ' on ' + " + R + ".order.placed })" } },
        { p: 1, key: 'reason', component: 'ToggleGroup', props: { expr: '({ value: ' + R + ".reason ?? undefined, items: ['Damaged', 'Arrived late', 'Changed mind'].map((r) => ({ value: r, label: r })) })" }, callbacks: { onChange: [{ set: R + '.reason', expr: 'evt.value' }] } },
        { p: 1, key: 'share', component: 'ToggleGroup', props: { expr: '({ value: String(' + R + ".share), items: [['1', 'Full'], ['0.5', 'Half']].map(([v, l]) => ({ value: v, label: l + ' · $' + (" + R + '.order.total * Number(v)).toFixed(2) })) })' }, callbacks: { onChange: [{ set: R + '.share', expr: 'Number(evt.value)' }] } },
        { p: 1, key: 'go', component: 'Button', props: { expr: "({ text: " + R + ".order.status === 'refunded' ? 'Refunded' : " + R + ".reason ? 'Refund $' + (" + R + '.order.total * ' + R + ".share).toFixed(2) : 'Pick a reason', variant: 'destructive', disabled: !" + R + ".reason || " + R + ".order.status === 'refunded' })" }, callbacks: { onClick: [{ confirm: 'Refund Jonas Weber?', expr: 'refundOrder({ id: 1042, amount: ' + R + '.order.total * ' + R + '.share, reason: ' + R + '.reason })' }, { set: R + '.order', expr: 'getOrder({ id: 1042 })' }] } },
        { p: 1, key: 'done', component: 'Alert', hidden: R + ".order.status !== 'refunded'", props: { expr: "({ status: 'success', title: 'Refunded $' + " + R + ".order.refunded.toFixed(2) + ' to Jonas Weber.' })" } },
      ],
    };
  }

  fnCode() {
    const tool = (name, description, input, output, execute) =>
      'export const ' + name + ' = standardTool({\n  name: "' + name + '",\n  description: "' + description + '",\n  inputSchema: z.object({\n' + input + '\n  }),\n  outputSchema: ' + output + ',\n  execute: ' + execute + ',\n});';
    return {
      getBill: tool('getBill', 'The open bill for a table, item by item.', '    table: z.number().int(),', 'BillSchema', '({ table }) => pos.openBill(table)'),
      requestPayments: tool('requestPayments', 'Asks each person to pay their share.', '    requests: z.array(z.object({\n      name: z.string(),\n      amount: z.number().meta({ description: "In dollars" }),\n    })),', 'z.object({ sent: z.number().int() })', '({ requests }) => payments.request(requests)'),
      getTripOptions: tool('getTripOptions', 'Places to stay and things to do in a city.', '    city: z.string(),\n    nights: z.number().int(),\n    people: z.number().int(),', 'TripOptionsSchema', '(input) => catalog.trip(input)'),
      savePlan: tool('savePlan', 'Saves a trip plan to the user’s account.', '    stay: z.string(),\n    activities: z.array(z.string()),', 'z.object({ id: z.string() })', '(plan) => plans.save(session.userId, plan)'),
      getHabits: tool('getHabits', 'The user’s habits and the days each was done.', '    week: z.enum(["current", "previous"]),', 'z.array(HabitSchema)', '({ week }) => habits.list(session.userId, week)'),
      setHabitDay: tool('setHabitDay', 'Marks a habit done or not done for one day.', '    id: z.string(),\n    day: z.number().int().min(0).max(6),\n    done: z.boolean(),', 'z.object({ ok: z.boolean() })', '(input) => habits.set(session.userId, input)'),
      listOrders: tool('listOrders', 'Orders, newest first.', '    since: z.enum(["today", "monday", "month"]),', 'z.array(OrderSchema)', '({ since }) => db.orders.list({ since })'),
      shipOrders: tool('shipOrders', 'Marks orders as shipped.', '    ids: z.array(z.number().int()),', 'z.object({ shipped: z.number().int() })', '({ ids }) => warehouse.ship(ids)'),
    };
  }

  screenFns() {
    return {
      bill: ['getBill', 'requestPayments'],
      trip: ['getTripOptions', 'savePlan'],
      habits: ['getHabits', 'setHabitDay'],
      orders: ['listOrders', 'shipOrders'],
    };
  }

  chatMeta() {
    return {
      coffee: { q: 'How much did I spend on coffee this month?', parts: 2 },
      lunch: { q: 'Who’s in for lunch on Friday?', parts: 1, text: 'Six people answered. Add your vote, then book the winning time.' },
      water: { q: 'Remind me to water the plants', parts: 1, text: 'Pick the days and a time, then save it.' },
      refund: { q: 'Refund Jonas Weber’s last order', parts: 1, text: 'The last order is #1042. Pick a reason and an amount.' },
    };
  }

  // ---------- flows ----------

  cast(key) {
    this.started = true;
    clearInterval(this.timer);
    const total = this.docs()[key].length;
    const text = this.reqs()[key].text;
    const reset = this.fresh(key);
    reset.screen = key;
    reset.cast = { key: key, typed: 0, thinking: true, n: 0 };
    reset.fn = null;
    this.setState(reset);
    let mark = 0;
    this.timer = setInterval(() => {
      const c = this.state.cast;
      if (!c) return clearInterval(this.timer);
      const now = Date.now();
      if (c.typed < text.length) return this.setState({ cast: Object.assign({}, c, { typed: Math.min(text.length, c.typed + 3) }) });
      if (c.thinking) {
        if (!mark) mark = now;
        if (now - mark < 650) return;
        mark = now;
        return this.setState({ cast: Object.assign({}, c, { thinking: false }) });
      }
      if (c.n < total) {
        if (now - mark < 280) return;
        mark = now;
        return this.setState({ cast: Object.assign({}, c, { n: c.n + 1 }) });
      }
      clearInterval(this.timer);
      this.setState({ cast: null, seen: Object.assign({}, this.state.seen, { [key]: true }) });
    }, 40);
  }

  pick(key) {
    const c = this.state.cast;
    if (c && c.key === key && !c.waiting) return;
    if (this.state.seen[key] && !this.state.cast) return this.setState({ screen: key, fn: null });
    this.cast(key);
  }

  ask(sc) {
    const id = this.state.nextId;
    this.setState({ chat: this.state.chat.concat([{ id: id, sc: sc }]), nextId: id + 1, chatBuild: { id: id, thinking: true, chars: 0, n: 0 } });
    const total = this.docs()[sc].length;
    const text = this.chatText(sc);
    clearInterval(this.chatTimer);
    let mark = Date.now();
    this.chatTimer = setInterval(() => {
      const b = this.state.chatBuild;
      if (!b) return clearInterval(this.chatTimer);
      const now = Date.now();
      if (b.thinking) {
        if (now - mark < 700) return;
        mark = now;
        return this.setState({ chatBuild: Object.assign({}, b, { thinking: false }) });
      }
      if (b.chars < text.length) return this.setState({ chatBuild: Object.assign({}, b, { chars: Math.min(text.length, b.chars + 3) }) });
      if (b.n < total) {
        if (now - mark < 300) return;
        mark = now;
        return this.setState({ chatBuild: Object.assign({}, b, { n: b.n + 1 }) });
      }
      clearInterval(this.chatTimer);
      this.setState({ chatBuild: null });
    }, 24);
  }

  chatText(sc) {
    if (sc !== 'coffee') return this.chatMeta()[sc].text;
    const d = this.coffeeDays();
    const now = d.now.reduce((s, x) => s + x, 0);
    const prev = d.prev.reduce((s, x) => s + x, 0);
    return 'You spent ' + this.money(now) + ' on coffee in the last 4 weeks, ' + this.money(now - prev) + ' more than the 4 weeks before. Try a daily limit:';
  }

  setIn(group, change) {
    this.setState({ [group]: Object.assign({}, this.state[group], change) });
  }

  burst(group) {
    clearTimeout(this.burstTimer);
    this.setState({ burstOn: group });
    this.burstTimer = setTimeout(() => this.setState({ burstOn: null }), 1100);
  }

  copy(text, id) {
    const done = (value) => this.setState({ copied: value });
    // Some frames deny the Clipboard API; copying the selected field still works there, and failing that the field stays selected.
    const fail = () => {
      const field = typeof document !== 'undefined' && document.getElementById({ hero: 'hero-skill', try: 'try-skill', starter: 'try-starter' }[id]);
      if (!field) return done(id + ':fail');
      field.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {}
      done(ok ? id : id + ':fail');
    };
    try {
      navigator.clipboard.writeText(text).then(() => done(id), fail);
    } catch (e) {
      fail();
    }
  }

  label(id) {
    if (this.state.copied === id) return 'Copied';
    if (this.state.copied === id + ':fail') return 'Select to copy';
    return 'Copy';
  }

  money(n) {
    return '$' + n.toFixed(2);
  }

  tokens(line) {
    const out = [];
    const re = /("(?:[^"\\]|\\.)*")(\s*:)?|([{}\[\],:])|([^"{}\[\],:]+)/g;
    let m;
    while ((m = re.exec(line))) {
      if (m[1] && m[2]) {
        out.push({ t: m[1], style: 'color: #A795FF', tip: KEY_TIPS[m[1].slice(1, -1)] });
        out.push({ t: m[2], style: 'color: #6F6A88' });
      } else if (m[1]) {
        out.push({ t: m[1], style: 'color: #F0C987' });
      } else if (m[3]) {
        out.push({ t: m[3], style: 'color: #6F6A88' });
      } else {
        out.push({ t: m[4], style: 'color: #C6FF3D' });
      }
    }
    return out;
  }

  plain(e) {
    const out = {};
    Object.keys(e).forEach((k) => {
      if (k !== 'p') out[k] = e[k];
    });
    return out;
  }

  // ---------- look ----------

  theme(name) {
    const base = {
      disabled: '; opacity: .45; cursor: not-allowed; box-shadow: none',
      logic:
        "display: block; margin-top: 6px; font-family: var(--font-mono); font-size: 11px; line-height: 1.45; background: #FFF3A8; color: #3B3000; border: 1px dashed #D9BC3A; border-radius: 8px; padding: 6px 8px; white-space: pre-wrap; overflow-wrap: anywhere; text-align: left; max-width: 100%",
    };
    if (name === 'bold') {
      return Object.assign(base, {
        font: "var(--font-sans)",
        surface: '#110E1F', ink: '#F3F0FF', muted: '#A49DC4', line: '#2A2447', track: '#2A2447',
        accent: '#C6FF3D', accentInk: '#14111F', ok: '#C6FF3D', warn: '#FFC53D', bad: '#FF6B6B',
        chrome: '#1A1630', chromeLine: '#2E2850', chromeMuted: '#8E87B0', promptBg: '#110E1F', promptInk: '#F3F0FF',
        radius: '10px', pill: '10px',
        window: 'border-radius: 22px; overflow: hidden; background: #110E1F; border: 1px solid #2E2850; box-shadow: 0 30px 70px rgba(20,10,60,.35)',
        card: 'background: #1C1733; border: 1px solid #2E2850; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 6px',
        cardTitle: 'margin: 0; font-weight: 700; font-size: 15.5px; color: #F3F0FF',
        h3: "margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 25px; letter-spacing: -0.02em; line-height: 1.2; color: #FFFFFF",
        stat: 'flex: 1 1 150px; min-width: 0; background: #1C1733; border: 1px solid #2E2850; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px',
        statValue: "font-family: var(--font-display); font-weight: 600; font-size: 24px; line-height: 1.15; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: #C6FF3D",
        big: "font-family: var(--font-display); font-weight: 600; font-size: 20px; color: #C6FF3D",
        chipOn: 'background: #C6FF3D; color: #14111F; border: 1px solid #C6FF3D',
        chipOff: 'background: #1C1733; color: #E4E0F5; border: 1px solid #3A3360',
        btnPrimary: 'background: #C6FF3D; color: #14111F; border: 0; border-radius: 10px; padding: 12px 22px; font-weight: 700; font-size: 15px; cursor: pointer',
        btnSm: 'background: transparent; color: #C6FF3D; border: 1px solid #C6FF3D; border-radius: 8px; padding: 5px 12px; font-weight: 600; font-size: 13px; cursor: pointer',
        input: 'background: #1C1733; color: #F3F0FF; border: 1px solid #3A3360; border-radius: 10px; padding: 10px 14px; font-size: 15px',
        headRow: "display: grid; grid-template-columns: 28px 2fr 0.8fr 1fr 1fr 70px; gap: 10px; align-items: center; padding: 10px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #A49DC4",
        row: 'display: grid; grid-template-columns: 28px 2fr 0.8fr 1fr 1fr 70px; gap: 10px; align-items: center; padding: 10px 16px; border-top: 1px solid #2A2447',
        rowSel: '; background: #241E40',
        alertOk: 'margin: 0; background: #1F2A10; color: #D8FF7A; border: 1px solid #4A6B12; border-radius: 10px; padding: 10px 14px; font-size: 14px',
        alertWarn: 'margin: 0; background: #2E2410; color: #FFD27A; border: 1px solid #6B5212; border-radius: 10px; padding: 10px 14px; font-size: 14px',
        badgeOn: 'display: inline-block; background: #C6FF3D; color: #14111F; border-radius: 6px; padding: 2px 9px; font-size: 12.5px; font-weight: 700',
        badgeOff: 'display: inline-block; background: #2A2447; color: #A49DC4; border-radius: 6px; padding: 2px 9px; font-size: 12.5px; font-weight: 600',
        replay: 'flex: 0 0 auto; background: #2A2447; color: #F3F0FF; border: 0; border-radius: 8px; padding: 7px 12px; font-size: 13px; font-weight: 600; cursor: pointer',
        tile: 'background: #1C1733; border: 1px solid #2E2850; border-radius: 12px',
        tileOn: 'background: #2B3A0E; border: 1px solid #C6FF3D; border-radius: 12px',
      });
    }
    if (name === 'paper') {
      return Object.assign(base, {
        font: "var(--font-mono)",
        surface: '#FFF4D6', ink: '#1D1730', muted: '#5C5470', line: '#1D1730', track: '#F1DFAF',
        accent: '#FF5A36', accentInk: '#FFFFFF', ok: '#0E8A5F', warn: '#B86E00', bad: '#D62F2F',
        chrome: '#FFE29A', chromeLine: '#1D1730', chromeMuted: '#3B3550', promptBg: '#FFFFFF', promptInk: '#1D1730',
        radius: '4px', pill: '4px',
        window: 'border-radius: 6px; overflow: hidden; background: #FFF4D6; border: 2.5px solid #1D1730; box-shadow: 10px 10px 0 #1D1730',
        card: 'background: #FFFFFF; border: 2px solid #1D1730; border-radius: 4px; box-shadow: 4px 4px 0 #1D1730; padding: 16px; display: flex; flex-direction: column; gap: 6px',
        cardTitle: 'margin: 0; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: .04em',
        h3: "margin: 0; font-family: var(--font-mono); font-weight: 600; font-size: 24px; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1.2",
        stat: 'flex: 1 1 150px; min-width: 0; background: #FFFFFF; border: 2px solid #1D1730; border-radius: 4px; box-shadow: 4px 4px 0 #1D1730; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px',
        statValue: "font-family: var(--font-mono); font-weight: 600; font-size: 24px; line-height: 1.15; font-variant-numeric: tabular-nums",
        big: "font-family: var(--font-mono); font-weight: 600; font-size: 20px",
        chipOn: 'background: #1D1730; color: #FFF4D6; border: 2px solid #1D1730',
        chipOff: 'background: #FFFFFF; color: #1D1730; border: 2px solid #1D1730',
        btnPrimary: 'background: #FF5A36; color: #FFFFFF; border: 2px solid #1D1730; border-radius: 4px; padding: 11px 20px; font-weight: 700; font-size: 14px; text-transform: uppercase; box-shadow: 4px 4px 0 #1D1730; cursor: pointer',
        btnSm: 'background: #FFFFFF; color: #1D1730; border: 2px solid #1D1730; border-radius: 4px; padding: 4px 10px; font-weight: 700; font-size: 12px; text-transform: uppercase; cursor: pointer',
        input: 'background: #FFFFFF; color: #1D1730; border: 2px solid #1D1730; border-radius: 4px; padding: 9px 12px; font-size: 14px',
        headRow: "display: grid; grid-template-columns: 28px 2fr 0.8fr 1fr 1fr 70px; gap: 10px; align-items: center; padding: 10px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 2px solid #1D1730",
        row: 'display: grid; grid-template-columns: 28px 2fr 0.8fr 1fr 1fr 70px; gap: 10px; align-items: center; padding: 10px 16px; border-top: 1px dashed #1D1730',
        rowSel: '; background: #FFE9B0',
        alertOk: 'margin: 0; background: #D7F5E6; color: #0B4F37; border: 2px solid #1D1730; border-radius: 4px; padding: 10px 14px; font-size: 13.5px',
        alertWarn: 'margin: 0; background: #FFE2B0; color: #6B3B00; border: 2px solid #1D1730; border-radius: 4px; padding: 10px 14px; font-size: 13.5px',
        badgeOn: 'display: inline-block; background: #FF5A36; color: #FFFFFF; border: 2px solid #1D1730; border-radius: 3px; padding: 1px 8px; font-size: 11.5px; font-weight: 700; text-transform: uppercase',
        badgeOff: 'display: inline-block; background: #FFFFFF; color: #1D1730; border: 2px solid #1D1730; border-radius: 3px; padding: 1px 8px; font-size: 11.5px; font-weight: 700; text-transform: uppercase',
        replay: 'flex: 0 0 auto; background: #FFFFFF; color: #1D1730; border: 2px solid #1D1730; border-radius: 4px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer',
        tile: 'background: #FFFFFF; border: 2px solid #1D1730; border-radius: 4px',
        tileOn: 'background: #FFE29A; border: 2px solid #1D1730; border-radius: 4px; box-shadow: 3px 3px 0 #1D1730',
      });
    }
    return Object.assign(base, {
      font: "var(--font-sans)",
      surface: '#FBF8FF', ink: '#1D1730', muted: '#6B6580', line: '#EEE8F6', track: '#EDE7F7',
      accent: '#7C5CFF', accentInk: '#FFFFFF', ok: '#13996F', warn: '#B87400', bad: '#E5484D',
      chrome: '#FFFFFF', chromeLine: '#EFE7F7', chromeMuted: '#8A839C', promptBg: '#F7F3FF', promptInk: '#1D1730',
      radius: '14px', pill: '999px',
      window: 'border-radius: 26px; overflow: hidden; background: #FFFFFF; border: 1px solid #EFE4D8; box-shadow: 0 30px 70px rgba(60,40,120,.16)',
      card: 'background: #FFFFFF; border: 1px solid #EEE8F6; border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 14px rgba(80,50,140,.06)',
      cardTitle: 'margin: 0; font-weight: 700; font-size: 15.5px',
      h3: "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 24px; letter-spacing: -0.02em; line-height: 1.2",
      stat: 'flex: 1 1 150px; min-width: 0; background: #FFFFFF; border: 1px solid #EEE8F6; border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 4px 14px rgba(80,50,140,.05)',
      statValue: "font-family: var(--font-display); font-weight: 600; font-size: 24px; line-height: 1.15; letter-spacing: -0.02em; font-variant-numeric: tabular-nums",
      big: "font-family: var(--font-display); font-weight: 600; font-size: 20px; color: #7C5CFF",
      chipOn: 'background: #7C5CFF; color: #FFFFFF; border: 1px solid #7C5CFF',
      chipOff: 'background: #FFFFFF; color: #1D1730; border: 1px solid #E4DCF2',
      btnPrimary: 'background: #7C5CFF; color: #FFFFFF; border: 0; border-radius: 999px; padding: 13px 24px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 8px 20px rgba(124,92,255,.35)',
      btnSm: 'background: #FFFFFF; color: #5A43B8; border: 1px solid #D9CFF5; border-radius: 999px; padding: 5px 14px; font-weight: 600; font-size: 13px; cursor: pointer',
      input: 'background: #FFFFFF; color: #1D1730; border: 1px solid #E4DCF2; border-radius: 999px; padding: 11px 16px; font-size: 15px',
      headRow: "display: grid; grid-template-columns: 28px 2fr 0.8fr 1fr 1fr 70px; gap: 10px; align-items: center; padding: 10px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #8A839C",
      row: 'display: grid; grid-template-columns: 28px 2fr 0.8fr 1fr 1fr 70px; gap: 10px; align-items: center; padding: 10px 16px; border-top: 1px solid #F1ECF8',
      rowSel: '; background: #F6F2FF',
      alertOk: 'margin: 0; background: #E3F8EF; color: #0B6146; border-radius: 14px; padding: 10px 14px; font-size: 14px',
      alertWarn: 'margin: 0; background: #FFF1D6; color: #7A4B00; border-radius: 14px; padding: 10px 14px; font-size: 14px',
      badgeOn: 'display: inline-block; background: #EEE8FF; color: #5A43B8; border-radius: 999px; padding: 2px 10px; font-size: 12.5px; font-weight: 600',
      badgeOff: 'display: inline-block; background: #E3F8EF; color: #0B6146; border-radius: 999px; padding: 2px 10px; font-size: 12.5px; font-weight: 600',
      replay: 'flex: 0 0 auto; background: #F3EEFF; color: #5A43B8; border: 0; border-radius: 999px; padding: 7px 13px; font-size: 13px; font-weight: 600; cursor: pointer',
      tile: 'background: #FFFFFF; border: 1px solid #EEE8F6; border-radius: 16px',
      tileOn: 'background: #F3EEFF; border: 1.5px solid #7C5CFF; border-radius: 16px',
    });
  }

  chip(t, on, extra) {
    return (on ? t.chipOn : t.chipOff) + '; border-radius: ' + t.pill + '; padding: 7px 14px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit' + (extra || '');
  }

  // ---------- render ----------

  gate(key, keys, list) {
    const p = this.partsFor(key);
    return list.map((x, i) => Object.assign({}, x, { on: !!p.e[keys[i]], wait: !!p.w[keys[i]] }));
  }

  partsFor(key) {
    const st = this.state;
    const docs = this.docs()[key];
    const c = st.cast && st.cast.key === key ? st.cast : null;
    const shown = c ? (c.typed < this.reqs()[key].text.length || c.thinking ? 0 : c.n) : docs.length;
    const on = {};
    const off = {};
    for (let k = 1; k <= 5; k++) {
      const exists = docs.some((e) => e.p === k);
      on['p' + k] = docs.slice(0, shown).some((e) => e.p === k);
      off['p' + k] = exists && !on['p' + k];
    }
    // e: the entry's line has arrived; w: its part is on screen but the line hasn't, so a skeleton holds its place.
    const e = {};
    const w = {};
    const all = this.docs();
    Object.keys(all).forEach((d) => all[d].forEach((x) => (e[x.key.replace(/-/g, '_')] = w[x.key.replace(/-/g, '_')] = false)));
    docs.forEach((d, i) => {
      const k = d.key.replace(/-/g, '_');
      e[k] = i < shown;
      w[k] = !e[k] && on['p' + d.p];
    });
    return { on: on, off: off, e: e, w: w, shown: shown, live: c };
  }

  billVals(t, logic, done) {
    const b = this.state.bill;
    const people = this.people();
    const sub = b.items.reduce((s, i) => s + i.price, 0);
    const mult = 1 + b.tip / 100;
    const share = (name) => b.items.filter((i) => i.who.indexOf(name) >= 0).reduce((s, i) => s + i.price / i.who.length, 0) * mult;
    const orphan = b.items.filter((i) => i.who.length === 0);
    const docs = this.docs().bill;
    const exprOf = (key) => docs.filter((e) => e.key === key)[0].props.expr;
    const setItem = (name, who) => this.setIn('bill', { items: b.items.map((i) => (i.name === name ? Object.assign({}, i, { who: who }) : i)), sent: false });
    const others = people.filter((p) => p.name !== 'Ana');
    return {
      subtitle: 'Table 12 · 6 items · paid by Ana',
      stats: this.gate('bill', ['s_sub', 's_tip', 's_total'], [
        { label: 'Subtotal', value: this.money(sub), showLogic: logic, expr: exprOf('s-sub') },
        { label: 'Tip ' + b.tip + '%', value: this.money(sub * b.tip / 100), showLogic: false, expr: '' },
        { label: 'Total', value: this.money(sub * mult), showLogic: false, expr: '' },
      ]),
      items: b.items.map((i) => ({
        emoji: i.emoji,
        name: i.name,
        price: this.money(i.price),
        each: i.who.length ? '÷ ' + i.who.length + ' = ' + this.money(i.price / i.who.length) + ' each' : 'Nobody picked yet',
        eachStyle: 'font-size: 13px; ' + (i.who.length ? 'color: ' + t.muted : 'color: ' + t.bad + '; font-weight: 600'),
        groupLabel: 'Who had the ' + i.name.toLowerCase(),
        people: people.map((p) => {
          const on = i.who.indexOf(p.name) >= 0;
          return {
            initial: p.name[0],
            label: p.name + (on ? ' had it' : ' did not have it'),
            pressed: on ? 'true' : 'false',
            toggle: () => setItem(i.name, on ? i.who.filter((w) => w !== p.name) : people.map((x) => x.name).filter((n) => n === p.name || i.who.indexOf(n) >= 0)),
            style:
              'width: 34px; height: 34px; border-radius: ' + (t.pill === '4px' ? '4px' : '50%') + '; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit; transition: transform .15s; ' +
              (on ? 'background: ' + p.color + '; color: #FFFFFF; border: 2px solid ' + p.color : 'background: transparent; color: ' + t.muted + '; border: 2px dashed ' + t.line),
          };
        }),
      })),
      tip: b.tip,
      tipText: b.tip + '% · ' + this.money(sub * b.tip / 100),
      setTip: (e) => this.setIn('bill', { tip: Number(e.target.value), sent: false }),
      tips: [10, 15, 20].map((n) => ({ label: n + '%', pressed: b.tip === n ? 'true' : 'false', style: this.chip(t, b.tip === n), pick: () => this.setIn('bill', { tip: n, sent: false }) })),
      people: people.map((p, idx) => {
        const amount = share(p.name);
        return {
          name: p.name === 'Ana' ? 'Ana (you)' : p.name,
          initial: p.name[0],
          avatar: 'width: 26px; height: 26px; border-radius: ' + (t.pill === '4px' ? '4px' : '50%') + '; background: ' + p.color + '; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px',
          amount: this.money(amount),
          note: b.items.filter((i) => i.who.indexOf(p.name) >= 0).length + ' items',
          bar: 'display: block; height: 6px; border-radius: 99px; background: ' + p.color + '; width: ' + Math.round((amount / (sub * mult)) * 100) + '%; transition: width .35s ease',
          showLogic: logic && idx === 0,
          expr: exprOf('person').replace("({ label: scopes.p, value: '$' + (", '').replace(').toFixed(2) })', ''),
        };
      }),
      sendOff: b.sent || orphan.length > 0,
      sendLabel: b.sent ? 'Requests sent ✓' : 'Send payment requests',
      sendStyle: t.btnPrimary + (b.sent || orphan.length > 0 ? t.disabled : ''),
      send: () => {
        this.setIn('bill', { sent: true });
        this.burst('bill');
      },
      note: orphan.length
        ? 'Pick who had the ' + orphan.map((i) => i.name.toLowerCase()).join(' and ') + ' first.'
        : b.sent
          ? 'Sent: ' + others.map((p) => p.name + ' ' + this.money(share(p.name))).join(', ') + '.'
          : 'Ana paid. Ben, Cleo and Dev get a request for their share.',
      noteStyle: 'font-size: 14px; ' + (orphan.length ? 'color: ' + t.bad + '; font-weight: 600' : b.sent ? 'color: ' + t.ok + '; font-weight: 600' : 'color: ' + t.muted),
      burst: this.state.burstOn === 'bill',
    };
  }

  tripVals(t, logic) {
    const tr = this.state.trip;
    const data = this.tripData();
    const stay = data.stays.filter((s) => s.id === tr.stay)[0];
    const chosen = data.acts.filter((a) => tr.picked.indexOf(a.id) >= 0);
    const cost = stay.night * 2 + chosen.reduce((s, a) => s + a.cost, 0);
    const left = tr.budget - cost;
    const clashing = chosen.filter((a, i) => chosen.some((b, j) => j !== i && a.day === b.day && a.start < b.end && b.start < a.end));
    const clash = clashing.length ? clashing : null;
    const docs = this.docs().trip;
    const ratio = Math.min(1, cost / tr.budget);
    const color = left < 0 ? t.bad : ratio > 0.9 ? t.warn : t.ok;
    const saveOff = tr.saved || left < 0 || !!clash;
    return {
      left: left >= 0 ? '€' + left + ' left' : '€' + -left + ' over',
      leftStyle: "font-family: var(--font-display); font-weight: 600; font-size: 26px; color: " + color,
      showLogic: logic,
      leftExpr: docs.filter((e) => e.key === 'left')[0].props.expr,
      spentText: '€' + cost + ' of €' + tr.budget,
      budget: tr.budget,
      budgetText: '€' + tr.budget,
      setBudget: (e) => this.setIn('trip', { budget: Number(e.target.value), saved: false }),
      meter: 'display: block; height: 14px; border-radius: 99px; background: ' + color + '; width: ' + Math.round(ratio * 100) + '%; transition: width .35s ease, background .35s',
      stays: data.stays.map((s) => ({
        emoji: s.emoji,
        label: s.label,
        price: '€' + s.night + ' a night',
        pressed: s.id === tr.stay ? 'true' : 'false',
        pick: () => this.setIn('trip', { stay: s.id, saved: false }),
        style: (s.id === tr.stay ? t.tileOn : t.tile) + '; color: inherit; padding: 14px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; cursor: pointer; font-family: inherit; text-align: left',
      })),
      days: [
        { v: 'Sat', l: 'Saturday' },
        { v: 'Sun', l: 'Sunday' },
      ].map((d) => ({ label: d.l, pressed: tr.day === d.v ? 'true' : 'false', style: this.chip(t, tr.day === d.v), pick: () => this.setIn('trip', { day: d.v }) })),
      acts: data.acts
        .filter((a) => a.day === tr.day)
        .map((a) => {
          const on = tr.picked.indexOf(a.id) >= 0;
          const bad = clashing.indexOf(a) >= 0;
          return {
            emoji: a.emoji,
            name: a.name,
            meta: a.time,
            cost: a.cost ? '€' + a.cost : 'free',
            checked: on,
            toggle: (e) => this.setIn('trip', { picked: e.target.checked ? tr.picked.concat([a.id]) : tr.picked.filter((x) => x !== a.id), saved: false }),
            style: 'display: flex; align-items: center; gap: 12px; padding: 10px 12px; cursor: pointer; ' + (bad ? 'background: rgba(255,170,0,.14); border-radius: 10px' : 'border-top: 1px solid ' + t.line),
          };
        }),
      clash: !!clash,
      clashText: clashing.map((a) => a.name).join(' and ') + ' overlap.',
      plan: chosen
        .slice()
        .sort((a, b) => (a.day === b.day ? a.start - b.start : a.day === 'Sat' ? -1 : 1))
        .map((a) => ({ when: a.day + ' ' + a.time.slice(0, 5), emoji: a.emoji, name: a.name })),
      empty: chosen.length === 0,
      saveOff: saveOff,
      saveLabel: tr.saved ? 'Saved ✓' : 'Save the plan',
      saveStyle: t.btnPrimary + (saveOff ? t.disabled : ''),
      save: () => {
        this.setIn('trip', { saved: true });
        this.burst('trip');
      },
      note: tr.saved ? 'Saved: ' + chosen.length + ' stops, €' + cost + ' for two.' : left < 0 ? 'Over budget: drop something or raise the budget.' : chosen.length + ' stops · €' + cost + ' for two',
      noteStyle: 'font-size: 14px; ' + (tr.saved ? 'color: ' + t.ok + '; font-weight: 600' : left < 0 ? 'color: ' + t.bad + '; font-weight: 600' : 'color: ' + t.muted),
      burst: this.state.burstOn === 'trip',
    };
  }

  habitVals(t, logic) {
    const h = this.state.habits;
    const list = this.habitList();
    const today = 4;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const doneOf = (id) => h.done[id] || [];
    const setDone = (id, arr) => this.setIn('habits', { done: Object.assign({}, h.done, { [id]: arr.slice().sort((a, b) => a - b) }) });
    const streak = (id) => {
      const d = doneOf(id);
      let n = 0;
      for (let i = today - 1; i >= 0 && d.indexOf(i) >= 0; i--) n++;
      return n + (d.indexOf(today) >= 0 ? 1 : 0);
    };
    const doneSoFar = list.reduce((s, x) => s + doneOf(x.id).filter((d) => d <= today).length, 0);
    const pct = Math.round((doneSoFar / (list.length * (today + 1))) * 100);
    const C = 2 * Math.PI * 54;
    const todayDone = list.filter((x) => doneOf(x.id).indexOf(today) >= 0);
    const atRisk = list.filter((x) => doneOf(x.id).indexOf(today) < 0 && doneOf(x.id).indexOf(today - 1) >= 0 && doneOf(x.id).indexOf(today - 2) >= 0);
    const docs = this.docs().habits;
    const message =
      todayDone.length === list.length
        ? 'Today: all ' + list.length + ' done. Nice week.'
        : 'Today: ' + todayDone.length + ' of ' + list.length + ' done.' + (atRisk.length ? ' Keep these streaks going: ' + atRisk.map((x) => x.icon).join(' ') : '');
    return {
      pct: pct + '%',
      dash: Math.round((pct / 100) * C) + ' ' + Math.round(C),
      ringLabel: pct + '% of this week’s habits done',
      message: message,
      showLogic: logic,
      expr: docs.filter((e) => e.key === 'row-streak')[0].props.expr,
      today: list.map((x) => {
        const on = doneOf(x.id).indexOf(today) >= 0;
        return {
          icon: x.icon,
          name: x.name,
          pressed: on ? 'true' : 'false',
          toggle: () => setDone(x.id, on ? doneOf(x.id).filter((d) => d !== today) : doneOf(x.id).concat([today])),
          style: (on ? t.tileOn : t.tile) + '; color: inherit; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-family: inherit; transition: transform .15s',
          checkStyle:
            'width: 24px; height: 24px; flex: 0 0 auto; border-radius: ' + (t.pill === '4px' ? '4px' : '50%') + '; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; ' +
            (on ? 'background: ' + t.accent + '; color: ' + t.accentInk : 'border: 2px solid ' + t.line + '; color: transparent'),
        };
      }),
      dayHeads: days.map((d, i) => ({ label: d, style: 'font-size: 12px; text-align: center; ' + (i === today ? 'color: ' + t.accent + '; font-weight: 700' : 'color: ' + t.muted) })),
      rows: list.map((x) => ({
        icon: x.icon,
        name: x.name,
        cells: days.map((d, i) => {
          const on = doneOf(x.id).indexOf(i) >= 0;
          const future = i > today;
          return {
            future: future,
            pressed: on ? 'true' : 'false',
            label: x.name + ', ' + d + (on ? ', done' : future ? ', later this week' : ', not done'),
            mark: on ? '✓' : '',
            toggle: () => setDone(x.id, on ? doneOf(x.id).filter((n) => n !== i) : doneOf(x.id).concat([i])),
            style:
              'justify-self: center; width: 32px; height: 32px; border-radius: ' + (t.pill === '4px' ? '4px' : '50%') + '; font-weight: 700; font-size: 14px; cursor: ' + (future ? 'default' : 'pointer') + '; font-family: inherit; ' +
              (on ? 'background: ' + t.accent + '; color: ' + t.accentInk + '; border: 2px solid ' + t.accent : future ? 'background: transparent; border: 2px dotted ' + t.line + '; opacity: .5' : 'background: transparent; color: ' + t.muted + '; border: 2px solid ' + t.line) +
              (i === today ? '; box-shadow: 0 0 0 3px ' + (t.accent === '#C6FF3D' ? 'rgba(198,255,61,.25)' : 'rgba(124,92,255,.18)') : ''),
          };
        }),
        streak: streak(x.id) ? '🔥 ' + streak(x.id) : '—',
        streakStyle: 'text-align: right; font-weight: 700; font-size: 14px; ' + (streak(x.id) >= 3 ? 'color: ' + t.warn : 'color: ' + t.muted),
      })),
      ideas: this.habitIdeas()
        .filter((x) => h.added.indexOf(x.id) < 0)
        .map((x) => ({ icon: x.icon, name: x.name, style: this.chip(t, false), add: () => this.setIn('habits', { added: h.added.concat([x.id]) }) })),
      allAdded: h.added.length === this.habitIdeas().length,
    };
  }

  orderVals(t, logic) {
    const o = this.state.orders;
    const q = o.q.trim().toLowerCase();
    const shown = o.list.filter((x) => (o.tab === 'all' || x.status === o.tab) && (x.customer + x.city + x.id).toLowerCase().indexOf(q) >= 0);
    const toship = o.list.filter((x) => x.status === 'toship');
    const picked = toship.filter((x) => o.sel[x.id]);
    const shownToShip = shown.filter((x) => x.status === 'toship');
    const allOn = shownToShip.length > 0 && shownToShip.every((x) => o.sel[x.id]);
    const ship = (ids) => {
      const sel = Object.assign({}, o.sel);
      ids.forEach((id) => delete sel[id]);
      this.setIn('orders', {
        list: o.list.map((x) => (ids.indexOf(x.id) >= 0 ? Object.assign({}, x, { status: 'shipped' }) : x)),
        sel: sel,
        note: 'Marked ' + ids.length + (ids.length === 1 ? ' order' : ' orders') + ' shipped.',
      });
    };
    const docs = this.docs().orders;
    const count = (s) => o.list.filter((x) => s === 'all' || x.status === s).length;
    return {
      stats: this.gate('orders', ['s_count', 's_value', 's_oldest'], [
        { label: 'To ship', value: String(toship.length), showLogic: false, expr: '' },
        { label: 'Waiting to ship', value: '$' + toship.reduce((s, x) => s + x.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), showLogic: logic, expr: docs.filter((e) => e.key === 's-value')[0].props.expr },
        { label: 'Oldest waiting', value: toship.length ? Math.max.apply(null, toship.map((x) => x.age)) + ' days' : '—', showLogic: false, expr: '' },
      ]),
      q: o.q,
      setQ: (e) => this.setIn('orders', { q: e.target.value }),
      tabs: [
        ['toship', 'To ship'],
        ['shipped', 'Shipped'],
        ['all', 'All'],
      ].map((p) => ({ label: p[1] + ' ' + count(p[0]), pressed: o.tab === p[0] ? 'true' : 'false', style: this.chip(t, o.tab === p[0]), pick: () => this.setIn('orders', { tab: p[0] }) })),
      allOn: allOn,
      toggleAll: (e) => {
        const sel = Object.assign({}, o.sel);
        shownToShip.forEach((x) => {
          sel[x.id] = e.target.checked;
        });
        this.setIn('orders', { sel: sel });
      },
      rows: shown.map((x) => ({
        id: x.id,
        customer: x.customer,
        city: x.city,
        placed: x.placed + ' · ' + x.age + 'd',
        total: this.money(x.total),
        status: x.status === 'toship' ? 'To ship' : 'Shipped',
        badge: x.status === 'toship' ? t.badgeOn : t.badgeOff,
        picked: !!o.sel[x.id],
        done: x.status !== 'toship',
        pickLabel: 'Select order ' + x.id,
        togglePick: (e) => this.setIn('orders', { sel: Object.assign({}, o.sel, { [x.id]: e.target.checked }) }),
        canShip: x.status === 'toship',
        ship: () => ship([x.id]),
        rowStyle: t.row + (o.sel[x.id] ? t.rowSel : ''),
      })),
      none: shown.length === 0,
      noneText: q ? 'No orders match “' + o.q + '”.' : o.tab === 'toship' ? 'Everything is shipped. 🎉' : 'No orders here.',
      bulkOff: picked.length === 0,
      bulkLabel: picked.length ? 'Ship ' + picked.length + ' selected · ' + this.money(picked.reduce((s, x) => s + x.total, 0)) : 'Select orders to ship',
      bulkStyle: t.btnPrimary + (picked.length ? '' : t.disabled),
      shipPicked: () => ship(picked.map((x) => x.id)),
      note: o.note || 'Tick a few rows, or ship one at a time.',
      noteStyle: 'font-size: 14px; ' + (o.note ? 'color: ' + t.ok + '; font-weight: 600' : 'color: ' + t.muted),
      showLogic: logic,
      bulkExpr: docs.filter((e) => e.key === 'bulk')[0].props.expr,
    };
  }

  chatVals() {
    const st = this.state;
    const c = this.theme('soft');
    c.btnGhost = 'background: #FFFFFF; color: #1D1730; border: 1px solid #E4DCF2; border-radius: 999px; padding: 10px 18px; font-weight: 600; font-size: 14.5px; cursor: pointer';
    c.btnDanger = 'background: #E5484D; color: #FFFFFF; border: 0; border-radius: 999px; padding: 10px 18px; font-weight: 700; font-size: 14.5px; cursor: pointer';
    c.card = 'background: #FFFFFF; border: 1px solid #EEE8F6; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; box-shadow: 0 4px 14px rgba(80,50,140,.06)';
    const chip = (on, extra) => this.chip(c, on, '; padding: 6px 12px; font-size: 13px' + (extra || ''));
    const docs = this.docs();

    const cd = this.coffeeDays();
    const cf = st.coffee;
    const sum = (a) => a.reduce((s, x) => s + x, 0);
    const weeks = [0, 1, 2, 3].map((w) => ({ now: sum(cd.now.slice(w * 7, w * 7 + 7)), prev: sum(cd.prev.slice(w * 7, w * 7 + 7)) }));
    const peak = Math.max.apply(null, weeks.map((w) => Math.max(w.now, w.prev)));
    const over = cd.now.filter((d) => d > cf.limit);
    const saved = cd.now.reduce((s, d) => s + Math.max(0, d - cf.limit), 0);

    const votes = this.lunchVotes().map((o) => ({ time: o.time, who: o.who.concat(st.lunch.vote === o.time ? ['You'] : []) }));
    const lead = votes.slice().sort((a, b) => b.who.length - a.who.length)[0];
    const most = Math.max.apply(null, votes.map((v) => v.who.length));

    const wd = st.water;
    const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const ordered = week.filter((d) => wd.days.indexOf(d) >= 0);
    const next = [5, 6, 0, 1, 2, 3, 4].map((i) => week[i]).filter((d) => wd.days.indexOf(d) >= 0)[0];

    const rf = st.refund;
    const total = 356.5;
    const amount = total * rf.share;

    const asked = st.chat.map((m) => m.sc);
    return {
      c: c,
      chat: st.chat.map((m) => {
        const meta = this.chatMeta()[m.sc];
        const b = st.chatBuild && st.chatBuild.id === m.id ? st.chatBuild : null;
        const text = this.chatText(m.sc);
        const shown = b ? (b.thinking || b.chars < text.length ? 0 : b.n) : docs[m.sc].length;
        const streaming = !!b && !b.thinking && b.chars >= text.length;
        const e = {};
        const w = {};
        ['coffee', 'lunch', 'water', 'refund'].forEach((k) => docs[k].forEach((d) => (e[d.key] = w[d.key] = false)));
        docs[m.sc].forEach((d, i) => {
          e[d.key] = i < shown;
          w[d.key] = streaming && i >= shown;
        });
        const open = !!st.docOpen[m.id];
        return {
          q: meta.q,
          thinking: !!(b && b.thinking),
          hasText: !(b && b.thinking),
          text: b ? text.slice(0, b.chars) : text,
          typing: !!(b && !b.thinking && b.chars < text.length),
          isCoffee: m.sc === 'coffee',
          isLunch: m.sc === 'lunch',
          isWater: m.sc === 'water',
          isRefund: m.sc === 'refund',
          e: e,
          w: w,
          done: !b,
          docId: String(m.id),
          docOpen: open,
          docLabel: open ? 'Hide the document' : 'Document · ' + docs[m.sc].length + ' entries',
          toggleDoc: () => { this.setState({ docOpen: Object.assign({}, st.docOpen, { [m.id]: !open }) }); if (!open) setTimeout(() => this.revealDoc(m.id), 60); },
          lines: open ? docs[m.sc].map((e) => ({ segs: this.line(e) })) : [],
        };
      }),
      coffee: {
        total: this.money(sum(cd.now)),
        change: '▲ ' + this.money(sum(cd.now) - sum(cd.prev)),
        changeStyle: 'font-size: 13px; font-weight: 700; color: #C4452B; background: #FFE7E0; border-radius: 999px; padding: 3px 10px',
        bars: weeks.map((w, i) => ({
          label: 'Week ' + (i + 1),
          style: 'display: block; width: 18px; border-radius: 6px 6px 2px 2px; background: #7C5CFF; height: ' + Math.round((w.now / peak) * 72) + 'px; transition: height .3s',
          prevStyle: cf.compare ? 'display: block; width: 18px; border-radius: 6px 6px 2px 2px; background: #E2D9FF; height: ' + Math.round((w.prev / peak) * 72) + 'px' : 'display: none',
        })),
        compare: cf.compare,
        toggleCompare: (e) => this.setIn('coffee', { compare: e.target.checked }),
        limit: cf.limit,
        limitText: '$' + cf.limit.toFixed(2) + ' a day',
        setLimit: (e) => this.setIn('coffee', { limit: Number(e.target.value) }),
        verdict: over.length
          ? 'You went over it on ' + over.length + ' of 28 days. Sticking to it would have saved ' + this.money(saved) + '.'
          : 'You never went over $' + cf.limit.toFixed(2) + ' in a day.',
      },
      lunch: {
        opts: votes.map((v) => {
          const mine = st.lunch.vote === v.time;
          return {
            time: v.time,
            who: v.who.join(', '),
            pressed: mine ? 'true' : 'false',
            vote: () => this.setIn('lunch', { vote: mine ? null : v.time }),
            style: (mine ? 'background: #F3EEFF; border: 1.5px solid #7C5CFF' : 'background: #FFFFFF; border: 1px solid #EEE8F6') + '; border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; font-family: inherit; color: inherit; text-align: left' + (st.lunch.booked ? '; cursor: default' : ''),
            bar: 'display: block; height: 6px; border-radius: 99px; background: ' + (v.who.length === most ? '#7C5CFF' : '#C9BCFF') + '; width: ' + Math.round((v.who.length / 7) * 100) + '%; transition: width .3s',
          };
        }),
        booked: !!st.lunch.booked,
        bookOff: !st.lunch.vote || !!st.lunch.booked,
        bookLabel: st.lunch.booked ? 'Booked ✓' : st.lunch.vote ? 'Book ' + lead.time + ' for 7' : 'Vote to book',
        bookStyle: c.btnPrimary + '; padding: 11px 18px; font-size: 14.5px' + (!st.lunch.vote || st.lunch.booked ? c.disabled : ''),
        book: () => this.setIn('lunch', { booked: lead.time }),
        bookedText: st.lunch.booked ? 'Booked Osteria Lucca, Friday ' + st.lunch.booked + ', table for 7. The team got an invite.' : '',
      },
      water: {
        days: week.map((d) => {
          const on = wd.days.indexOf(d) >= 0;
          return { label: d, pressed: on ? 'true' : 'false', style: chip(on, '; padding: 6px 9px; min-width: 42px'), toggle: () => this.setIn('water', { days: on ? wd.days.filter((x) => x !== d) : wd.days.concat([d]) }) };
        }),
        times: ['08:00', '13:00', '19:00'].map((tm) => ({ label: tm, pressed: wd.time === tm ? 'true' : 'false', style: chip(wd.time === tm), pick: () => this.setIn('water', { time: tm }) })),
        summary: ordered.length ? 'Every ' + ordered.join(', ') + ' at ' + wd.time + ' · next: ' + next + ' ' + wd.time : 'Pick at least one day.',
        saved: wd.saved,
        saveOff: wd.saved || ordered.length === 0,
        saveLabel: wd.saved ? 'Saved ✓ · next on ' + next + ' at ' + wd.time : 'Save reminder',
        saveStyle: c.btnPrimary + '; padding: 11px 18px; font-size: 14.5px' + (wd.saved || ordered.length === 0 ? c.disabled : ''),
        save: () => this.setIn('water', { saved: true }),
      },
      refund: {
        status: rf.done ? 'refunded' : 'paid',
        badge: rf.done ? c.badgeOff.replace('#E3F8EF', '#FDECEC').replace('#0B6146', '#B42318') : c.badgeOn,
        totalText: this.money(total),
        reasons: ['Damaged', 'Arrived late', 'Changed mind'].map((r) => ({ label: r, pressed: rf.reason === r ? 'true' : 'false', style: chip(rf.reason === r), pick: () => this.setIn('refund', { reason: r }) })),
        shares: [
          [1, 'Full'],
          [0.5, 'Half'],
        ].map((p) => ({ label: p[1] + ' · ' + this.money(total * p[0]), pressed: rf.share === p[0] ? 'true' : 'false', style: chip(rf.share === p[0]), pick: () => this.setIn('refund', { share: p[0] }) })),
        doneOn: !!rf.done,
        goOff: !rf.reason || !!rf.done,
        goLabel: rf.done ? 'Refunded' : rf.reason ? 'Refund ' + this.money(amount) : 'Pick a reason',
        goStyle: c.btnDanger + (!rf.reason || rf.done ? c.disabled : ''),
        go: () => this.setState({ confirm: { title: 'Refund Jonas Weber?', text: 'Order #1042, ' + this.money(amount) + ' back to the card. Reason: ' + rf.reason.toLowerCase() + '.', ok: 'Refund ' + this.money(amount), amount: amount } }),
        doneText: rf.done ? 'Refunded ' + this.money(rf.done) + ' to Jonas Weber.' : '',
      },
      asks: ['lunch', 'water', 'refund']
        .filter((sc) => asked.indexOf(sc) < 0)
        .map((sc) => ({
          label: { lunch: '🍝 Who’s in for lunch on Friday?', water: '🪴 Remind me to water the plants', refund: '↩️ Refund Jonas’s last order' }[sc],
          ask: () => this.ask(sc),
          style: 'background: #F6F2FF; color: #3F2D8F; border: 1px solid #E2D9FF; border-radius: 999px; padding: 8px 13px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left' + (st.chatBuild ? '; opacity: .5; cursor: not-allowed' : ''),
        })),
      hasAsks: asked.length < 4,
      noAsks: asked.length >= 4,
      chatBusy: !!st.chatBuild,
      confirmOn: !!st.confirm,
      confirm: st.confirm || { title: '', text: '', ok: '' },
      confirmNo: () => this.setState({ confirm: null }),
      confirmYes: () => {
        const a = st.confirm.amount;
        this.setState({ confirm: null, refund: Object.assign({}, st.refund, { done: a }) });
      },
    };
  }

  revealDoc(id) {
    const t = typeof document !== 'undefined' && document.getElementById('chat-thread');
    const d = t && t.querySelector('[data-doc="' + id + '"]');
    if (!d) return;
    const over = d.getBoundingClientRect().bottom - t.getBoundingClientRect().bottom + 12;
    if (over > 0) t.scrollTop += over;
  }

  renderVals() {
    const st = this.state;
    const t = this.theme(st.theme);
    const dev = st.lens === 'dev';
    const key = st.screen;
    const docs = this.docs();
    const parts = this.partsFor(key);
    const live = parts.live;
    const req = this.reqs()[key];
    const total = docs[key].length;
    const casting = !!live;
    const typing = casting && !live.waiting && live.typed < req.text.length;
    const fnNames = this.screenFns()[key];
    const fnPick = st.fn && fnNames.indexOf(st.fn) >= 0 ? st.fn : fnNames[0];
    const usedCount = {};
    docs[key].forEach((e) => {
      usedCount[e.component] = (usedCount[e.component] || 0) + 1;
    });
    const bytes = docs[key].reduce((s, e) => s + JSON.stringify(this.plain(e)).length + 1, 0);
    const lensBtn = (on) =>
      'border: 0; border-radius: 999px; padding: 9px 16px; font-size: 14.5px; font-weight: 600; cursor: pointer; font-family: inherit; ' + (on ? 'background: var(--l-ink); color: var(--l-bg)' : 'background: transparent; color: var(--l-text)');

    return Object.assign(
      {
        lenses: [
          { v: 'user', l: '🙂 What your users see' },
          { v: 'dev', l: '</> What your developers see' },
        ].map((x) => ({ label: x.l, pressed: st.lens === x.v ? 'true' : 'false', style: lensBtn(st.lens === x.v), pick: () => this.setState({ lens: x.v }) })),
        reqs: Object.keys(this.reqs()).map((k) => {
          const r = this.reqs()[k];
          const on = k === key;
          return {
            icon: r.icon,
            tag: r.tag + (st.seen[k] && !on ? ' · built ✓' : ''),
            tagColor: r.color,
            text: r.text,
            pressed: on ? 'true' : 'false',
            pick: () => this.pick(k),
            iconStyle: 'flex: 0 0 auto; width: 46px; height: 46px; border-radius: 14px; background: ' + r.soft + '; display: inline-flex; align-items: center; justify-content: center; font-size: 24px',
            style:
              'flex: 1 1 260px; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 20px; cursor: pointer; font-family: inherit; color: var(--l-ink); transition: transform .15s, box-shadow .15s; ' +
              (on ? 'background: var(--l-card); border: 2px solid ' + r.color + '; box-shadow: 0 10px 24px var(--l-shadow); transform: translateY(-2px)' : 'background: var(--l-card-soft); border: 2px solid var(--l-line)'),
          };
        }),
        t: t,
        prompt: casting ? req.text.slice(0, live.typed) : req.text,
        typing: typing,
        casting: casting && !live.waiting,
        status: casting ? (live.waiting ? 'ready' : typing ? 'typing…' : live.thinking ? 'model is writing…' : 'streaming ' + live.n + '/' + total) : total + ' entries · rendered',
        replay: () => this.cast(key),
        dev: dev,
        docInfo: parts.shown + ' / ' + total + ' lines · ' + (bytes / 1024).toFixed(1) + ' KB',
        lines: docs[key].slice(0, parts.shown).map((e, i) => ({ n: i + 1, cls: casting && i === parts.shown - 1 ? 'fresh' : '', segs: this.line(e) })),
        thinking: casting && !typing && !live.waiting && live.thinking,
        thinkingScreen: casting && !typing && !live.waiting && live.thinking,
        is: { bill: key === 'bill', trip: key === 'trip', habits: key === 'habits', orders: key === 'orders' },
        on: parts.on,
        off: parts.off,
        e: parts.e,
        w: parts.w,
        bill: this.billVals(t, dev),
        trip: this.tripVals(t, dev),
        habits: this.habitVals(t, dev),
        ord: this.orderVals(t, dev),
        burst: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'].map((b, i) => ({ cls: 'burst ' + b, e: ['🎉', '✨', '💜', '⭐', '🎊', '✨', '💸', '🎉'][i] })),
        fns: fnNames.map((n) => ({ name: n, pressed: n === fnPick ? 'true' : 'false', pick: () => this.setState({ fn: n }), style: 'font-family: var(--font-mono); font-size: 12.5px; border-radius: 8px; padding: 5px 10px; cursor: pointer; ' + (n === fnPick ? 'background: #C6FF3D; color: #14111F; border: 1px solid #C6FF3D' : 'background: #262038; color: #ECEBF3; border: 1px solid #3A3255') })),
        fnCode: this.fnCode()[fnPick],
        used: Object.keys(usedCount).map((n) => ({ name: n, n: usedCount[n] })),
        devNote: 'The screen shows these through your implementations. The style switch below swaps the implementations and keeps the same document.',
        themes: [
          { v: 'soft', l: 'Soft' },
          { v: 'bold', l: 'Neon' },
          { v: 'paper', l: 'Paper' },
        ].map((x) => ({ label: x.l, pressed: st.theme === x.v ? 'true' : 'false', pick: () => this.setState({ theme: x.v }), style: lensBtn(st.theme === x.v) })),
        stageNote: dev
          ? 'Left: the document as it streams in, one JSON line per element. Yellow notes: expressions the model wrote. Below: the functions your developers wrote and the components it picked.'
          : 'Every screen here is a document a model wrote for the request, rendered with registered components. No model is attached to this page: these are recorded samples.',
        copyHeroSkill: () => this.copy('npx skills add finom/uicast', 'hero'),
        copyTrySkill: () => this.copy('npx skills add finom/uicast', 'try'),
        trySkillLabel: this.label('try'),
        heroSkillLabel: this.label('hero'),
        copyStarter: () => this.copy('npx create-next-app@latest my-app --example https://github.com/finom/uicast/tree/main/examples/starter', 'starter'),
        starterLabel: this.label('starter'),
      },
      this.chatVals(),
      this.lowerVals(),
    );
  }

  lowerVals() {
    const st = this.state;
    const ok = { bg: '#1F2A10', fg: '#D8FF7A', bd: '#4A6B12' };
    const no = { bg: '#2E1414', fg: '#FFB4A8', bd: '#6B2A22' };
    const exprs = [
      { code: 'scopes.root.orders.reduce((a, o) => a + o.total, 0)', result: '✅ → 5', why: 'Plain JavaScript over JSON data.', tone: ok },
      { code: 'listOrders()', result: '✅ a host function you registered', why: 'Callable in seed and callbacks.', tone: ok },
      { code: 'fetch("/api/orders")', result: '❌ throws', why: '"fetch" is not available in expressions.', tone: no },
      { code: 'document.cookie', result: '❌ throws', why: 'So do "window", "localStorage", "eval", …', tone: no },
    ];
    return {
      teams: [
        { icon: '⚡', bg: 'var(--l-coral-soft)', title: 'New screens without a release', body: 'A report for one customer, a form for one process: built when someone asks, from parts your team already has.' },
        { icon: '🎨', bg: 'var(--l-violet-soft)', title: 'Your look on every screen', body: 'Only your components are used, so a generated screen looks like the rest of your product. Try the style switch above.' },
        { icon: '🔒', bg: 'var(--l-green-soft)', title: 'Your rules still hold', body: 'Screens reach your data only through the functions your developers expose, and your server checks permissions on every call.' },
        { icon: '💬', bg: 'var(--l-amber-soft)', title: 'Answers that do the work', body: 'In a chat, an answer can be a form, a chart or a list with actions, and blocks in one conversation share state.' },
      ].map((x) => Object.assign(x, { iconStyle: 'width: 48px; height: 48px; border-radius: 16px; background: ' + x.bg + '; display: inline-flex; align-items: center; justify-content: center; font-size: 24px' })),
      faq: [
        { q: 'Will it look like our product?', a: 'Yes, if your components do. The model can only use the components your developers registered, and your own React code renders them. The style switch above shows one document in three designs.' },
        { q: 'Can a generated screen do something we didn’t allow?', a: 'It can only call the functions your developers registered. Its logic runs in an interpreter with no access to the network, cookies or the page. Your server still checks permissions on every call, as it does today.' },
        { q: 'Which AI model does it need?', a: 'Any model you can call that streams text. The prompt is printed from your code, so it stays in step with your components and functions.' },
        { q: 'Can we keep a screen that works well?', a: 'Yes. A screen is a document of plain JSON lines. Store it and render it again later; the live demo saves generated pages this way.' },
        { q: 'What does it take to start?', a: 'Your developers register components and functions once. The reference catalog has 106 shadcn/ui components to start from, and an agent skill can do the wiring.' },
      ].map((x, i) => ({ q: x.q, a: x.a, open: !!st.faqOpen[i], sign: st.faqOpen[i] ? '−' : '+', toggle: () => this.setState({ faqOpen: Object.assign({}, st.faqOpen, { [i]: !st.faqOpen[i] }) }) })),
      exprs: exprs.map((x) => ({
        code: x.code,
        result: x.result,
        why: x.why,
        whyColor: x.tone.fg,
        badge: 'font-weight: 700; font-size: 14px; color: ' + x.tone.fg,
        style: 'display: flex; flex-direction: column; gap: 6px; background: ' + x.tone.bg + '; border: 1px solid ' + x.tone.bd + '; border-radius: 12px; padding: 12px 14px',
      })),
      devSteps: [
        { n: '01', title: 'Define components, functions', body: 'Your design system and your endpoints, each behind a schema: the closed set the model builds from.' },
        { n: '02', title: 'AI generates', body: 'Derived values, visibility and events are short JavaScript expressions, checked before they run.' },
        { n: '03', title: 'Get an app, logic included', body: 'Elements mount as they arrive. Clicks run callbacks that call your functions and write reactive state.' },
      ],
      devMore: [
        { title: 'Events carry declared payloads', body: 'An event can carry data. Inside a callback, evt is the payload, shaped by the definition. It is not React’s SyntheticEvent.', link: 'Events', href: '/events' },
        { title: 'Expressions call host functions', body: 'The functions you register, each a standard-tool with a name, a description, schemas and execute. They are how a document reaches your backend.', link: 'Host functions', href: '/expr/functions' },
        { title: 'Chat replies carry live UI', body: 'The Streamdown plugin renders each uicast fenced block in a Markdown reply as a live renderer. All blocks in a chat share the root scope.', link: 'Chat surfaces', href: '/streamdown' },
      ],
      nextSteps: [
        { title: 'Getting started', body: 'install and render your first document.', href: '/getting-started' },
        { title: 'Concepts', body: 'the model, expressions and scopes.', href: '/concepts' },
        { title: 'Component definition', body: 'build your own components.', href: '/def' },
        { title: 'Streaming', body: 'stream entries from a route and render them as they arrive.', href: '/streaming' },
      ],
    };
  }
}
