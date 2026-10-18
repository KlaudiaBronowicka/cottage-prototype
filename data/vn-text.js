/* =====================================================================
 * data/vn-text.js — PLACEHOLDER VN TEXT (Narrative Writer's, trimmed)
 * ---------------------------------------------------------------------
 * Source: "Cottage Encounter — Paper Prototype Outline" + kit section 4.
 * Swap any line freely. Tokens {POV} {C1} {C2} {HOST} {BEING} {OBJECT}
 * are replaced from the active name set in SKINS (URL ?skin=A|B|C).
 * Line format:  { who: 'C1', text: '...' }   (who = slot key or null for narration)
 *               { narr: '...' }               (stage direction / narration)
 * ===================================================================== */
var VN_TEXT = {
  SKINS: {
    neutral: { POV: 'POV', C1: 'COMPANION 1', C2: 'COMPANION 2', HOST: 'HOST', BEING: 'the BEING', OBJECT: 'the OBJECT' },
    A: { POV: 'Hania', C1: 'Ola',    C2: 'Kinga', HOST: 'Wanda',     BEING: 'the domowik', OBJECT: "Irena's address book" },
    B: { POV: 'Ewa',   C1: 'Marta',  C2: 'Iga',   HOST: 'the landlady', BEING: 'the zmora', OBJECT: "Julia's photo" },
    C: { POV: 'Agata', C1: 'Dorota', C2: 'Lena',  HOST: 'the caretaker', BEING: 'the Licho', OBJECT: "Leokadia's notebook" }
  },

  title: 'The Cottage — encounter prototype',
  subtitle: 'Greybox playtest build. Placeholder text. Nothing is final.',

  // ---------- INTRO (short VN before the encounter) ----------
  intro: [
    { scene: 'Beat 1 · Arrival (evening)', lines: [
      { narr: 'Gravel under the tyres. A low whitewashed cottage, a crooked fence, the treeline black behind it. The {HOST} waits at the gate with a key on a string.' },
      { who: 'HOST', text: 'Dzień dobry, girls. You found it. Most people drive past twice.' },
      { who: 'C2',   text: 'We drove past three times. She refused to trust the map.' },
      { who: 'HOST', text: "One bed or two in the big room? I don't ask questions, I just count pillows." },
      { who: 'C2',   text: 'Two pillows. One bed. She steals the blanket either way.' },
      { who: 'HOST', text: 'Then I bring the thick one. One thing. Shut the gate after dark. Because I said so, and because my mother said so.' },
      { who: 'C1',   text: '(quietly, to her phone) Not now. ... Work. Always work. Pass the kompot.' }
    ]},
    { scene: 'Beat 2 · The footprints (morning)', lines: [
      { who: 'C2', text: 'Footprints. All the way round the house. Nothing comes in. Nothing goes out. They just... go round.' },
      { who: 'C1', text: 'I heard it. Around three. I thought it was one of you. Then I counted, and you were both asleep.' }
    ]},
    { scene: 'Beat 3 · Day', spots: true }, // the three spots below are shown here
    { scene: 'Beat 4 · Evening', lines: [
      { narr: 'Dinner. Pierogi from the village shop, burned slightly. Rain on the window. The fire in the stove ticks.' },
      { who: 'C2', text: 'Rule for tonight: nobody goes out. Nobody opens the door.' }
    ], choices: ['bond', 'key'] },
    { scene: 'Night two', lines: [
      { narr: "Late. The lights flicker and fail. Footsteps outside, slow, circling. Then a voice from the yard — the {POV}'s own voice — calling {C1} by name." },
      { who: 'C1',  text: "(already on her feet) That's you. That's your voice." },
      { who: 'POV', text: "I'm right here. I'm right here. Don't open the door." }
    ]}
  ],

  spots: {
    '3a': { label: 'The {HOST} in her garden (sets up T1, the Being)', lines: [
      { who: 'POV',  text: 'Pani, there are footprints round the cottage.' },
      { who: 'HOST', text: 'Then they belong to the house, not to the road. Something walks round a house to keep it. Or to be let in.' }
    ]},
    '3b': { label: '{C1} at the treeline (sets up T2, her secret)', lines: [
      { who: 'C1', text: "Can I tell you later? Properly. Not here. ... I'm good at carrying things." },
      { narr: 'She looks past the {POV} into the trees, as if she heard her name.' }
    ]},
    '3c': { label: '{OBJECT} (sets up T3, the past)', lines: [
      { narr: 'The {OBJECT}: this cottage is in it. The village, the lane, the crooked fence.' },
      { who: 'POV', text: '(to herself) You were here. Why were you here?' }
    ]}
  },

  choices: {
    bond: { prompt: 'After dinner, who does the {POV} sit with?', options: [
      { value: 'C1', label: 'Sit with {C1} on the step.', after: 'She leans her head on your shoulder. "Thanks for not pushing."' },
      { value: 'C2', label: 'Wash up with {C2}.',        after: 'She flicks water at you. "You\'re worried about her too."' }
    ]},
    key: { prompt: 'What does the {POV} do with {OBJECT}?', options: [
      { value: 'SHARED', label: 'Share it: "This place is in here. I don\'t know why."' },
      { value: 'KEPT',   label: 'Keep it: "Nothing. Long day."' }
    ]}
  },

  // ---------- ENCOUNTER flavour ----------
  encounterGoal: 'Hold together until dawn and learn as much as you can.',
  pressureBands: [
    { min: 0, max: 1, text: 'Footsteps circling; the stove ticks; jokes still work.' },
    { min: 2, max: 3, text: 'The lights fail; the voice calls {C1} by name.' },
    { min: 4, max: 5, text: 'Something tries the handle; {C1} at the window, hand on the latch.' },
    { min: 6, max: 6, text: '{C1} is outside. The encounter ends.' }
  ],
  events: {
    footsteps: 'Slow, under the bedroom window.',
    voice:     "The {POV}'s own voice calls {C1} by name.",
    lights:    'The bulb hums, then dies.',
    gate:      'It opens on its own.',
    message:   "{C1}'s phone buzzes. No sender.",
    silence:   'Total silence. Worse than the footsteps.',
    handle:    'Something tries it. Slowly.',
    voice2:    'Closer now. Kinder.'
  },
  helpLines: { c1: "\"I'm here. I'm not going anywhere.\"", c2: '"Rule for tonight: nobody goes out."' },
  threads: {
    T1: 'What circles the house, and does it want to keep the house or be let in?',
    T2: 'Why did {C1} nearly go outside, and what is she hiding?',
    T3: 'Why does {OBJECT} name this cottage, and who was here before?'
  },
  earlyEnd: '{C1} walks out into the dark. The door swings on its hinge.',
  dawn: 'Grey light. Birdsong. Dawn.',

  // ---------- OUTRO (outcome scenes + inserts) ----------
  outcomes: {
    '1':  { title: 'Outcome 1 · Full success', lines: [
      { narr: 'Dawn. Birdsong. The footprints have stopped at the door, as if something sat down there to rest.' },
      { who: 'C1',   text: 'I owe you both the truth. All of it.' },
      { who: 'C2',   text: "That's it? You've been carrying that since Warsaw? Come here." },
      { who: 'HOST', text: "(at breakfast, looking at {OBJECT}) I knew that hand the moment I saw it. Sit. It's a long story, and a good one." },
      { who: 'POV',  text: 'I think I know why we came here now.' }
    ]},
    '2a': { title: 'Outcome 2a · Mixed — T3 open', lines: [
      { narr: 'Dawn. The thing round the house is understood, and {C1} has finally said it out loud.' },
      { who: 'C1',   text: 'Thank you for not letting me go out there. And for listening.' },
      { who: 'HOST', text: '(seeing {OBJECT}, her face closes) Where did you get that? Eat your breakfast. You have a long drive.' },
      { who: 'C2',   text: '(in the car) She knows something about that page.' },
      { who: 'POV',  text: "Next time. I'll ask next time." }
    ]},
    '2b': { title: 'Outcome 2b · Mixed — T2 open', lines: [
      { narr: 'Dawn. The {HOST} tells the story behind {OBJECT} over coffee, and the footprints make sense now.' },
      { who: 'POV', text: '(to {C1}) Last night. The voice. Do you want to talk about it?' },
      { who: 'C1',  text: '(bright smile) I want to talk about how good this coffee is.' },
      { who: 'C2',  text: "(quietly) She'll tell us. Give her time." },
      { narr: 'In the car, {C1} puts her headphones in and watches the trees.' }
    ]},
    '2c': { title: 'Outcome 2c · Mixed — T1 open', lines: [
      { narr: 'Dawn. {C1} told them everything in the dark, and the {HOST} has explained {OBJECT}. But outside...' },
      { who: 'C2',   text: 'Um. Guys. Come and look at the car.' },
      { narr: 'Footprints round the house — and for the first time a single line of them leading to the car, stopping at the boot.' },
      { who: 'HOST', text: 'Shut the gate behind you when you go. Not that it will help now.' },
      { who: 'C1',   text: 'Together this time.' }
    ]},
    '3':  { title: 'Outcome 3 · Failure that continues', lines: [
      { narr: 'The door was open. {C1} was gone. They find her at dawn at the treeline, barefoot, cold, unhurt, with no memory of walking out.' },
      { who: 'C1',   text: "I heard you calling. It was your voice. I'm sorry." },
      { who: 'POV',  text: "Don't. You're here." },
      { who: 'C2',   text: "We're leaving. Now." },
      { who: 'HOST', text: "(at the gate, older than yesterday) Go on. It'll still be here when you're ready to understand it." }
    ]},
    // RULED (Kostka 2026-10-18): Outcome 3b is used when DAWN is reached with 0-1 Threads and Escaped together = Y.
    // Text: Narrative Writer (Bajka), supplied 2026-10-18 (also in section 5 of the outline page). [Brackets] render in italics.
    '3b': { title: 'Outcome 3b · Dawn, Together (variant)', lines: [
      { narr: '[Grey light. All three of them are on the kitchen floor in blankets, backs against the cold stove, {C1} in the middle holding both their hands. The door is still shut.]' },
      { who: 'C1',   text: "We're all here. [beat] We're all here, right?" },
      { who: 'POV',  text: 'All here. [She counts anyway.] One, two, three.' },
      { who: 'C2',   text: '[at the window] The footprints are back. More of them. Closer to the door.' },
      { who: 'HOST', text: "[at the gate with fresh bread, studying their faces] You kept the door shut. Good. [beat] That's all you did, isn't it?" },
      { narr: "[In the car {OBJECT} sits on the {POV}'s lap. Nobody can say what walked round the house, or why it wanted {C1}. But nobody is missing.]" }
    ]}
  },
  inserts: {
    // Outcome 3b only (Bajka): exactly one of together1 / together0, plus the line for the one resolved Thread.
    together1:    [{ who: 'C2', text: 'Well. We got one answer.' }, { who: 'POV', text: 'One.' }],
    together1_T1: [{ narr: '[They know what circled the house, but not why it wanted {C1}.]' }],
    together1_T2: [{ narr: '[{C1} told them her secret in the dark, but nobody knows what was outside.]' }],
    together1_T3: [{ narr: "[The {HOST} explains {OBJECT}'s page over breakfast, but won't talk about the night.]" }],
    together0:    [{ who: 'C1', text: "So we don't know anything." }, { who: 'C2', text: "We know we're bad at sleeping." }, { narr: '[Nobody laughs, then everybody does.]' }],
    escapedN:     [{ narr: '{C1} has mud on her feet and won\'t say how far she got.' }, { who: 'C1', text: "I'm fine. I came back, didn't I?" }],
    bondC1:       [{ who: 'C1', text: 'You held on to me. I felt it.' }],
    bondC2:       [{ who: 'C2', text: "Good teamwork. Don't tell anyone I said something nice." }],
    shared:       [{ who: 'C2', text: 'Thanks for showing us the page. It helped, knowing.' }],
    kept:         [{ narr: "{OBJECT} is heavy in the {POV}'s bag. Nobody else knows it's there." }],
    highPressure: [{ narr: 'Nobody slept. The door handle has scratches nobody wants to talk about.' }]
  }
};
if (typeof module !== 'undefined') module.exports = VN_TEXT;
