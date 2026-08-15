/**
 * Bejacastle - Story, Lore & Narrative Engine
 * Contains all atmospheric chapters, dialogue trees, diary logs,
 * inspectable object lore, puzzles, and multiple endings in German.
 */

const CASTLE_STORY = {
  title: "BEJACASTLE: DAS SPUK-SCHLOSS IM WALD",
  
  chapters: [
    {
      id: 1,
      name: "KAPITEL I: DER VERFLUCHTE WALD",
      subtitle: "Verirrt in der ewigen Mitternacht",
      introText: [
        "Es ist tiefe Nacht. Ein dichter, eisiger Nebel kriecht zwischen den uralten Tannen hervor.",
        "Du hast den Waldweg längst aus den Augen verloren. Jeder Baum sieht gleich aus.",
        "Aus dem Dickicht starren dich glühende Augen an, und der Wind heult wie ein hungriges Ungeheuer.",
        "Finde eine Lichtquelle und suche einen Weg hinauf zum Felsplateau... Gerüchten zufolge thront dort das verlassene Schloss Beja."
      ],
      goal: "Finde die Laterne und den Runenstein, der den Weg zur Steintreppe öffnet.",
      mapTheme: "forest"
    },
    {
      id: 2,
      name: "KAPITEL II: DAS EISERNE SCHLOSSTOR",
      subtitle: "Vor den Toren des Grauens",
      introText: [
        "Ein ohrenbetäubender Donnerschlag zerreißt die Stille!",
        "Vor dir ragen die düsteren Türme und Zinnen von Schloss Beja in den stürmischen Nachthimmel.",
        "Das massive eiserne Haupttor ist fest verriegelt. Auf dem anliegenden alten Friedhof heulen Wölfe.",
        "Finde das fehlende Zahnrad im Mausoleum und den Torschlüssel, um den Mechanismus zu aktivieren."
      ],
      goal: "Repariere die Zugbrücke und entriegele das Schlosstor.",
      mapTheme: "courtyard"
    },
    {
      id: 3,
      name: "KAPITEL III: DIE VERLASSENE EINGANGSHALLE",
      subtitle: "Flüsternde Porträts & Staub",
      introText: [
        "Mit einem markerschütternden Knarren fällt das schwere Schlosstor hinter dir ins Schloss.",
        "Du stehst in der gigantischen, eiskalten Eingangshalle. Staubige Kronleuchter hängen von der Decke.",
        "Die Augen auf den uralten Ölgemälden scheinen jeder deiner Bewegungen zu folgen...",
        "Entzünde den Kamin und finde das Tagebuch des verschollenen Burgherren Graf Beja."
      ],
      goal: "Entzünde die Kaminfeuer und finde den Bibliotheksschlüssel.",
      mapTheme: "grand_hall"
    },
    {
      id: 4,
      name: "KAPITEL IV: DIE BIBLIOTHEK & KATAKOMBEN",
      subtitle: "Die Schatten der Ahnen",
      introText: [
        "Tausende uralte Folianten verrotten in den Regalen. Ein geheimer Durchgang führt hinab.",
        "In den eisigen Katakomben unter dem Schloss ruhen die Sarkophage der Familie von Beja.",
        "Eine weiße Geistergestalt schwebt durch die Gänge... Wenn sie dir zu nahe kommt, droht dein Verstand zu brechen!",
        "Löse das Siegel der Ahnen und finde das Amulett des Schutzes."
      ],
      goal: "Weiche den Geistern aus, löse das Runenrätsel und steige in den Schattenturm.",
      mapTheme: "crypt"
    },
    {
      id: 5,
      name: "KAPITEL V: DER SCHATTENTURM & DAS FINALE",
      subtitle: "Die Stunde der Entscheidung",
      introText: [
        "Du erreichst die Spitze des Schattenturms. Der Sturm tobt um die zerschlagenen Buntglasfenster.",
        "Auf dem Altar pulsiert das uralte Schattensiegel, das den Wald seit Jahrhunderten in Dunkelheit hüllt.",
        "Die Stimmen der Vorfahren fordern deine Entscheidung: Zerstörst du den Fluch, fliehst du oder beanspruchst du die Macht?"
      ],
      goal: "Richte die drei Altar-Monolithen aus und wähle dein Schicksal!",
      mapTheme: "tower"
    }
  ],

  // Lore diary entries scattered through the castle
  diaries: [
    {
      id: "diary_1",
      title: "Tagebuch Seite 12 (1842)",
      text: "„Der Wald verändert sich... Seit Wochen dringt kein Sonnenstrahl mehr durch die Wipfel. Die Dorfbewohner meiden das Schloss. Nachts höre ich ein Kratzen an den Außenmauern. Was auch immer dort draußen erwacht ist, es will herein.“"
    },
    {
      id: "diary_2",
      title: "Tagebuch Seite 48 (1843)",
      text: "„Das Tor habe ich mit dreifachem Eisen und einem Zahnradmechanismus versiegelt. Niemand soll mehr hinein – und niemand heraus. Meine geliebte Gemahlin Eleonore wandelt nachts durch die Bibliothek... doch ihr Herz schlägt nicht mehr.“"
    },
    {
      id: "diary_3",
      title: "Tagebuch Seite 89 (1844)",
      text: "„Die Katakomben sind nicht mehr sicher. Die Schatten haben eigene Körper angenommen. Wer die Gruft betreten will, muss das Familienwappen der Bejas bei sich tragen, um das uralte Bannsiegel nicht zu brechen.“"
    },
    {
      id: "diary_4",
      title: "Tagebuch Seite 114 (1845)",
      text: "„Ich habe das Siegel auf der Turmspitze platziert. Nur drei reine Kristalle der Ausrichtung können die Dunkelheit bannen. Wenn du dies liest, Fremder... beende mein Werk oder die Nacht wird ewig währen.“"
    }
  ],

  // Inspectable object descriptions
  loreObjects: {
    tree_faces: "In die uralte Rinde des Baumes ist eine menschliche Fratze geschnitzt. Der Harz riecht süßlich und unheilvoll.",
    monolith_forest: "Ein verwitterter Runenstein. Die Gravur glimmt in schwachem Smaragdgrün, wenn du die Laterne näherst.",
    raven_roost: "Drei schwarze Raben mustern dich mit unnatürlich klugen, gelben Augen.",
    tombstone_graveyard: "Hier ruht Graf Heinrich von Beja (1780-1845). Die Inschrift lautet: 'Wer die Schwelle überschreitet, kehrt niemals im Licht zurück.'",
    gargoyle_gate: "Eine finstere Wasserspeier-Statue aus schwarzem Basalt. Ihre steinerne Klaue zeigt mahnend auf das Schlossportal.",
    grand_clock: "Eine monumentale Standuhr. Die Zeiger stehen seit Jahrhunderten starr auf Mitternacht (00:00).",
    fireplace_hall: "Ein riesiger Steinkamin. Kalte Asche liegt darin. Mit einem Funken könnte er Wärme und Licht spenden.",
    creepy_portrait: "Ein lebensgroßes Porträt der Schlossherrin. Wo auch immer du im Raum stehst: Ihre Augen scheinen dich direkt anzustarren.",
    bookshelf_secret: "Eine Reihe ledergebundener Folianten. Ein Band mit goldener Prägung scheint lose im Regal zu sitzen.",
    sarcophagus_crypt: "Ein eiskalter Marmorsarg. Kälte strömt aus den Fugen, und aus dem Inneren hörst du ein dumpfes Scharren.",
    shadow_altar: "Der uralte Altar des Schattens. Drei Kristallsockel sind in den Boden eingelassen und warten auf Aktivierung."
  },

  // Multiple Endings
  endings: {
    salvation: {
      id: "salvation",
      title: "🌟 ENDE I: DIE ERLÖSUNG DES VERFLUCHTEN SCHLOSSES",
      text: "Du setzt die drei Kristalle in perfekter Harmonie ein. Ein gleißender Lichtstrahl schießt in den Himmel und zerschlägt die ewige Finsternis! Der Spuk löst sich auf, die Seelen finden Frieden, und die Morgensonne taucht Schloss Beja in goldenes Licht. Du hast den Fluch gebrochen!",
      badge: "Held der Dämmerung"
    },
    sacrifice: {
      id: "sacrifice",
      title: "🌟 ENDE I: DIE ERLÖSUNG DES VERFLUCHTEN SCHLOSSES",
      text: "Du setzt die drei Kristalle in perfekter Harmonie ein. Ein gleißender Lichtstrahl schießt in den Himmel und zerschlägt die ewige Finsternis! Der Spuk löst sich auf, die Seelen finden Frieden, und die Morgensonne taucht Schloss Beja in goldenes Licht. Du hast den Fluch gebrochen!",
      badge: "Held der Dämmerung"
    },
    escape: {
      id: "escape",
      title: "🏃 ENDE II: DIE PANISCHE FLUCHT",
      text: "Die Schrecken des Schlosses waren zu gewaltig. Mit letzter Kraft rettest du dich durch das zerberstende Tor zurück in den Wald, während die Türme im Nebel versinken. Du hast überlebt... doch das Schicksal von Schloss Beja wird dich in deinen Albträumen für immer verfolgen.",
      badge: "Überlebender der Nacht"
    },
    darkness: {
      id: "darkness",
      title: "👑 ENDE III: DER NEUE SCHATTENHERR",
      text: "Fasziniert von der uralten Macht des Turms absorbierst du die Schattenenergie. Die Geister des Schlosses verneigen sich vor dir. Die Augen auf den Porträts glühen auf – du bist nun der ewige Herr über das Schloss im verfluchten Wald.",
      badge: "Graf der Finsternis"
    },
    shadow_lord: {
      id: "shadow_lord",
      title: "👑 ENDE III: DER NEUE SCHATTENHERR",
      text: "Fasziniert von der uralten Macht des Turms absorbierst du die Schattenenergie. Die Geister des Schlosses verneigen sich vor dir. Die Augen auf den Porträts glühen auf – du bist nun der ewige Herr über das Schloss im verfluchten Wald.",
      badge: "Graf der Finsternis"
    }
  }
};

window.CASTLE_STORY = CASTLE_STORY;
