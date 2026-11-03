/* pair-up-drills: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own PAIR_SETS and RECALL_TABLES (Intro-Pharmacology-
 * exam1-drill/src/browser_test.js section 12, "every drug: five distinct answers,
 * the table's own line among them", applied to every mode of every table): every
 * item of every mode is offered its number of different answers (or every
 * different answer the mode has, when it has fewer), its own among them, none from
 * a row with the same `distinct` value, its row's `alts` among them.
 *
 * On Intro to Pharmacology's own data (the IP line below, written by
 * port_from_ip.js from its app.js, drugs.js and poison_table.js at 929cd62): the
 * module's items for the four poisoning-table modes are the asks and answers
 * Intro to Pharmacology's ptItems builds, in its order; for each of its 39 drugs,
 * "Name the receptor" offers 5 different lines with the table's own line and its
 * flipped twin among them and no "None" wording; "Name the drug" offers 4 drugs, no
 * other one with the same receptor and action; the Pair up drug set has the rows
 * its pairDrugs builds.
 *
 * The build step: no PAIR_SETS or RECALL_TABLES, a box twice in a one-chip-per-box
 * set, a mode naming a column no row has, list cells of different lengths in one
 * row, and an HTML tag in a cell each stop the build with that reason.
 *
 * On a scratch copy with Intro to Pharmacology's sets and tables (ids prefixed ip-),
 * in Chromium (its browser_test.js section 12 ported, and the Pair up and
 * poisoning-table behaviour of its app.js, which its own tests do not drive): the
 * three tabs; Pair up served 7 of a 14-pair set and the 9-pair set whole; a chip
 * tapped then a box tapped is placed, one dragged is placed, a chip tapped in a box
 * returns to the tray, a second chip put in a taken box sends the first back; with
 * several chips per box two share one; Check marks every chip, puts the wrong one
 * first with where it belongs and why, and keeps the best score in the progress
 * through a reload; Retry the wrong ones returns only the wrong chip. The drug
 * drill: five answers, a right tap, a wrong tap with "You said" and "1 to redo",
 * the round ended with "Redo the 1 missed", the redo round of one, the best score
 * and the miss kept; Name the drug with four. The poisoning table: Name the
 * antidote over its 12 rows, Enter goes on, Cover and reveal with every covered
 * cell a Show button, one shown, Show all, Hide again, another cover choice; a tap on
 * Skip or an answer within 350 ms of Next (the end of a double tap) is not taken.
 * `near`: after a row's own answer and its alts, the answers offered come from the
 * rows with the same `near` value first (Intro to Pharmacology's rxAnswers and
 * rxOptions: the same section first).
 *
 * Persistence, in a second browser context with every mode's misses and a best score
 * per set and mode saved: a reload brings them back and the misses lead the round;
 * Export progress carries them and Import into a new profile brings them back; each
 * profile keeps its own; a reload 400 ms after Check keeps the new score, a reload at
 * once after Check is reported (the core writes 150 ms after the last change); with
 * storage denied and full the student is told, the stored progress is left as it was,
 * and the next change after storage works is saved with everything earlier; a saved
 * value in another shape is read as none and the tables still open.
 *
 * PUD_SHOTS=<folder> writes screenshots there.
 *
 *     node features/pair-up-drills/test.js
 */
const fs = require('fs'), path = require('path'), os = require('os');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/pair-up-drills/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

const IP = {"pairSets":[{"id":"ip-rec","name":"Receptor → what an agonist does there","cite":"ANS slides 13, 24, 27, 31, 34–35; Adrenergic slide 18; (T) 10/1","pairs":[["β1 in the heart","rate and force up","β1 is Gs: cAMP goes up, and in the heart the rate and the contractility rise (sympathetic)."],["M2 in the heart","bradycardia","M2 is Gi: cAMP goes down and K+ channels open, so the heart slows (parasympathetic)."],["α1 on vessel smooth muscle","constriction","α1 is Gq: Ca++ rises in the smooth muscle and it contracts; TPR and afterload go up."],["β2 on vessel or airway smooth muscle","dilation","β2 is Gs: cAMP relaxes smooth muscle. In the airway it is reached by adrenal epinephrine, not by a nerve."],["M3 on the endothelium","nitric oxide: dilation","M3 is Gq on the lining cell: its Ca++ makes nitric oxide, which relaxes the muscle next door. Same Gq as α1, opposite result, because the cell is different."],["M3 in the gut","more motility: diarrhea","M3 is Gq on gut smooth muscle: Ca++ rises, motility and tone go up, the D of DUMBBELSS."],["α2 on the sympathetic nerve ending","less NE released","α2 is Gi on the nerve ending itself, the presynaptic brake: less NE comes out. Clonidine uses it; mirtazapine blocks it."],["β1 on the JG cells","renin release","β1 is Gs on the juxtaglomerular cells: renin is released, the first step of the RAAS. A β blocker lowers it."],["β3 in the bladder","relaxes: urine retained","β3 is Gs on bladder smooth muscle: cAMP relaxes it, so the bladder holds more urine (mirabegron)."],["M3 in the bladder","urination","M3 is Gq on the bladder muscle: Ca++ rises and it contracts, the U of DUMBBELSS."],["α1 in the eye","mydriasis","α1 is Gq on the radial muscle of the iris: it contracts and pulls the pupil open (phenylephrine)."],["M3 in the eye","miosis","M3 is Gq on the circular muscle of the iris: it contracts and the pupil narrows, the M of DUMBBELSS."],["Nn in a ganglion","Na+ in: the next neuron fires","Nn is an ion channel, not a GPCR: ACh opens it, Na+ enters and the postganglionic neuron fires. Both divisions use it."],["Nm on skeletal muscle","contraction","Nm is the ion channel at the neuromuscular junction: ACh opens it, Na+ enters, the muscle contracts. N for neuron, M for muscle."]]},{"id":"ip-dumb","name":"DUMBBELSS: each letter, with its receptor","cite":"ANS slides 24, 27; Cholinergic slides 13–14","pairs":[["D","Diarrhea (gut M3)","Gut smooth muscle M3 (Gq): more motility and tone."],["U","Urination (bladder M3)","Bladder muscle M3 (Gq): contraction."],["M","Miosis (eye M3)","Circular muscle of the iris, M3 (Gq): the pupil narrows."],["B (first)","Bradycardia (heart M2)","Heart M2 (Gi): cAMP down, the rate falls. The one letter that is not M3 or M1."],["B (second)","Bronchial constriction (airway M3)","Airway smooth muscle M3 (Gq): contraction; the lungs are parasympathetic only."],["E","Emesis (CNS M1)","Brain M1 (Gq): excitation, vomiting."],["L","Lacrimation (glands M3)","Lacrimal glands M3 (Gq): secretion."],["S (first)","Salivation (glands M3)","Salivary glands M3 (Gq): secretion. Both divisions cause it, because the sympathetic fiber here releases ACh."],["S (second)","Stimulation of the CNS (M1)","Brain M1 (Gq): excitation. His spelling DUMBBELSS has two S: salivation, then stimulation."]]},{"id":"ip-anti","name":"Anti-DUMBBELSS: what the antagonist gives instead","cite":"Cholinergic slides 19, 30, 32","pairs":[["Diarrhea","Constipation","Atropine blocks gut M3: the motility ACh drove is gone."],["Urination","Urinary retention","Bladder M3 blocked: the muscle does not contract (oxybutynin, trospium use this)."],["Miosis","Mydriasis","Iris circular muscle M3 blocked: the pupil widens (tropicamide)."],["Bradycardia","Tachycardia","Heart M2 blocked: the parasympathetic tone that holds the rate down is removed, so the sympathetic side runs unopposed."],["Bronchial constriction","Bronchial dilation","Airway M3 blocked: the airway opens (ipratropium, tiotropium)."],["Emesis, CNS stimulation","CNS effects: hallucinations, restlessness, coma","Brain M1 blocked: his slide 32 lists hallucinations, restlessness and coma at high doses."],["Lacrimation","Dry eyes","Lacrimal gland M3 blocked: no secretion."],["Salivation","Dry mouth","Salivary gland M3 blocked: xerostomia, the ADR every muscarinic antagonist shares."]]},{"id":"ip-gprot","name":"Receptor → G protein, or ion channel","cite":"ANS slides 4, 13, 24, 34–35; RAAS lecture","pairs":[["M1","Gq","M1 (brain): PLC, IP3, Ca++ up: excitation."],["M2","Gi","M2 (heart): adenylate cyclase inhibited, cAMP down: bradycardia."],["M3","Gq","M3 (everywhere else): PLC, IP3, Ca++ up: smooth muscle and glands."],["α1","Gq","α1: PLC, IP3, Ca++ up: vasoconstriction, mydriasis."],["α2","Gi","α2: cAMP down on the nerve ending: less NE released."],["β1","Gs","β1: adenylate cyclase on, cAMP up: heart rate and force, renin."],["β2","Gs","β2: cAMP up relaxes smooth muscle: bronchodilation, vasodilation."],["β3","Gs","β3: cAMP up relaxes the bladder."],["AT1","Gq","AT1: Ca++ up: vasoconstriction, aldosterone release."],["AT2","Gi","AT2: the physiological antagonist of AT1."],["Nn","ion channel: no G protein","Nn (ganglia, brain, adrenal medulla): Na+ in, no G protein."],["Nm","ion channel: no G protein","Nm (skeletal muscle): Na+ in, no G protein."]],"bins":true},{"id":"ip-drug","name":"Drug → its receptor (Exam 2 list)","cite":"Pharmacology_Exam_2_Drug_List.pdf; the All drugs table","pairs":[["Succinylcholine","Nm","Depolarizing agonist: opens the channel. Phase I: end plate stays depolarized; phase II: blocks the channel"],["Curare-like drugs","Nm","Non-depolarizing: competitive, reversible antagonist"],["Neostigmine, pyridostigmine","no receptor: enzyme, transporter or release","Reversible AChE inhibitors (indirect: raise ACh)"],["Physostigmine, donepezil, rivastigmine","no receptor: enzyme, transporter or release","Reversible AChE inhibitors"],["Organophosphates","no receptor: enzyme, transporter or release","Irreversible AChE inhibitors (covalent bond)"],["Botulinum toxin","no receptor: enzyme, transporter or release","Endopeptidase: cleaves SNARE proteins, so ACh is not released"],["Methacholine, carbachol, bethanechol","muscarinic (M1, M2, M3)","Non-selective, reversible muscarinic agonists"],["Atropine","muscarinic (M1, M2, M3)","Non-selective, reversible (competitive) muscarinic antagonist"],["Benztropine","muscarinic (M1, M2, M3)","Atropine analog; antagonist more selective for brain M1"],["Tropicamide","muscarinic (M1, M2, M3)","Muscarinic antagonist"],["Ipratropium, tiotropium; aclidinium, umeclidinium","muscarinic (M1, M2, M3)","Inhaled muscarinic antagonists; ipratropium short acting, tiotropium long acting; aclidinium and umeclidinium: high M3 affinity, slow dissociation"],["Oxybutynin, trospium, solifenacin","muscarinic (M1, M2, M3)","Reversible muscarinic antagonists, more selective toward bladder M3"],["Cocaine","no receptor: enzyme, transporter or release","NE reuptake inhibitor: complete NET blocker"],["Dextroamphetamine, amphetamine, lisdexamfetamine, methylphenidate, dexmethylphenidate","no receptor: enzyme, transporter or release","Primary: release of NE, dopamine and serotonin from the presynaptic terminal. Secondary (weak): reuptake block, MAO block"],["Phenelzine","no receptor: enzyme, transporter or release","Irreversible, non-selective MAO-A and MAO-B inhibitor"],["Selegiline","no receptor: enzyme, transporter or release","Irreversible, selective MAO-B inhibitor (low doses)"],["Phenylephrine","α1","Selective α1 agonist"],["Clonidine","α2","Selective α2 agonist"],["Prazosin","α1","Selective, reversible α1 antagonist"],["Mirtazapine","α2","Antagonist at presynaptic α2 (also H1, muscarinic, α1)"],["Dobutamine","β1","Selective β1 agonist"],["Albuterol, levalbuterol, salmeterol, formoterol","β2","β2 agonists"],["Mirabegron","β3","Selective β3 agonist"],["Isoproterenol","β1","Non-selective β agonist: “iso equal”"],["Metoprolol, atenolol, nebivolol","β1","Selective β1 antagonists"],["Nitroglycerin, nitroprusside, isosorbide","no receptor: enzyme, transporter or release","NO donors: NO → soluble guanylyl cyclase (sGC) → ↑cGMP"],["Sildenafil, tadalafil","no receptor: enzyme, transporter or release","Phosphodiesterase (PDE) inhibitors: cGMP is not broken down"],["Aliskiren","no receptor: enzyme, transporter or release","Selective, reversible renin inhibitor"],["Captopril, enalapril, lisinopril","no receptor: enzyme, transporter or release","Selective, reversible angiotensin-converting enzyme (ACE) inhibitors"],["Losartan, valsartan","AT1","Angiotensin II receptor blockers (ARBs), 10,000-fold AT1 over AT2"],["Spironolactone, eplerenone","MR","Mineralocorticoid receptor (MR) antagonists: aldosterone antagonists, potassium-sparing diuretics"],["Metoprolol","β1","Selective β1 antagonist"]],"bins":true}],"tables":[{"id":"ip-rx","tab":"Drug ↔ receptor","title":"Drug ↔ receptor","intro":"Every drug on the Exam 2 table, one at a time. Name the receptor: the drug is shown with five answers written the way the drug table writes them; tap the one that is the table's own line. Name the drug: a receptor, action and site are shown; tap the drug. A miss comes back at the end of the round and leads the next one.","cite":"the Exam 2 drug table (All drugs page), built from the professor's slides and the official list","name":"name","columns":[["line","The table's line"],["cls","Class"],["rec","Receptor"],["soa","Site"],["moa","Mechanism"],["why","Why"]],"covers":[["all","Cover the line and the class",["line","cls"]]],"modes":[{"id":"rec","label":"Name the receptor","ask":"name","answer":"line","prompt":"Which receptor does it act on, and how? Pick one.","options":5,"near":"sec","alts":"flip"},{"id":"drug","label":"Name the drug","ask":"ask","answer":"name","prompt":"Which drug is this?","options":4,"near":"sec","distinct":"key"}],"rows":[{"id":"ip-e2nmj:varen","name":"Varenicline","sec":"Neuromuscular junction and nicotinic drugs","line":"Nn, α4/β2 · agonist (partial)","ask":"Nn, α4/β2 · agonist · site: Brain","key":"Nn · agonist","cls":"Agonist · partial","rec":"Nn, α4/β2","soa":"Brain","moa":"Partial agonist, high affinity","flip":"Nn, α4/β2 · antagonist","why":"It competes with nicotine for the brain Nn receptor and holds it partly on, so craving and withdrawal fall."},{"id":"ip-e2nmj:sch","name":"Succinylcholine","sec":"Neuromuscular junction and nicotinic drugs","line":"Nm · agonist (depolarizing)","ask":"Nm · agonist · site: Skeletal muscle","key":"Nm · agonist","cls":"Agonist · depolarizing","rec":"Nm (Nn at the ganglia with prolonged infusion)","soa":"Skeletal muscle; autonomic ganglia as a side effect","moa":"Depolarizing agonist: opens the channel. Phase I: end plate stays depolarized; phase II: blocks the channel","flip":"Nm · antagonist","why":"It is not broken down quickly like ACh, so the end plate cannot repolarize and fire again."},{"id":"ip-e2nmj:curare","name":"Curare-like drugs (-cur-: rocuronium, vecuronium, pancuronium)","sec":"Neuromuscular junction and nicotinic drugs","line":"Nm · antagonist (non-depolarizing)","ask":"Nm · antagonist · site: Skeletal muscle","key":"Nm · antagonist","cls":"Antagonist · non-depolarizing","rec":"Nm","soa":"Skeletal muscle; no CNS effect","moa":"Non-depolarizing: competitive, reversible antagonist","flip":"Nm · agonist","why":"Reversible: more ACh at the junction outcompetes it."},{"id":"ip-e2nmj:neo","name":"Neostigmine, pyridostigmine","sec":"Neuromuscular junction and nicotinic drugs","line":"No receptor directly; more ACh at muscarinic and nicotinic receptors · indirect (AChE inhibitor)","ask":"None directly · indirect or donor · site: Periphery, including the NMJ","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · AChE inhibitor","rec":"None directly; more ACh at muscarinic and nicotinic receptors","soa":"Periphery, including the NMJ; do not cross the BBB (quaternary amines)","moa":"Reversible AChE inhibitors (indirect: raise ACh)","why":"Staying out of the brain puts the ACh rise at the muscle without central effects."},{"id":"ip-e2nmj:physo","name":"Physostigmine, donepezil, rivastigmine","sec":"Neuromuscular junction and nicotinic drugs","line":"No receptor directly; more ACh everywhere · indirect (AChE inhibitor)","ask":"None directly · indirect or donor · site: CNS and periphery: cross the BBB (physostigmine a tertiary amine","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · AChE inhibitor","rec":"None directly; more ACh everywhere","soa":"CNS and periphery: cross the BBB (physostigmine a tertiary amine; donepezil, rivastigmine lipophilic)","moa":"Reversible AChE inhibitors","why":"Crossing the BBB lets them raise ACh in the brain as well."},{"id":"ip-e2nmj:organo","name":"Organophosphates (malathion, parathion, sarin, soman, tabun); echothiophate","sec":"Neuromuscular junction and nicotinic drugs","line":"No receptor directly; more ACh everywhere · indirect (irreversible, AChE inhibitor)","ask":"None directly · indirect or donor · site: Ganglia, NMJ, CNS","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · irreversible, AChE inhibitor","rec":"None directly; more ACh everywhere","soa":"Ganglia, NMJ, CNS; echothiophate: eye (ciliary M3), topical","moa":"Irreversible AChE inhibitors (covalent bond)","why":"A covalent bond cannot be outcompeted; only pralidoxime frees the enzyme."},{"id":"ip-e2nmj:botox","name":"Botulinum toxin","sec":"Neuromuscular junction and nicotinic drugs","line":"No receptor · antagonist (blocks ACh release)","ask":"None · antagonist · site: Presynaptic terminal","key":"no receptor of its own · antagonist","cls":"Antagonist · blocks ACh release","rec":"None (presynaptic)","soa":"Presynaptic terminal","moa":"Endopeptidase: cleaves SNARE proteins, so ACh is not released","why":"It acts before ACh is released, not at the receptor."},{"id":"ip-e2chol:ach","name":"Acetylcholine","sec":"Cholinergic (muscarinic) drugs","line":"Nn, Nm, M1, M2, M3 · agonist","ask":"Nn, Nm, M1, M2, M3 · agonist · site: Everywhere ACh is released","key":"M1 + M2 + M3 + Nn + Nm · agonist","cls":"Agonist","rec":"Nn, Nm, M1, M2, M3","soa":"Everywhere ACh is released","moa":"Endogenous agonist","flip":"Nn, Nm, M1, M2, M3 · antagonist","why":"The only cholinergic agonist that binds both nicotinic and muscarinic receptors."},{"id":"ip-e2chol:musc","name":"Methacholine, carbachol, bethanechol (“chol”), pilocarpine","sec":"Cholinergic (muscarinic) drugs","line":"M1, M2, M3; not nicotinic · agonist","ask":"M1, M2, M3 · agonist · site: Central and periphery","key":"M1 + M2 + M3 · agonist","cls":"Agonist","rec":"M1, M2, M3; not nicotinic","soa":"Central and periphery","moa":"Non-selective, reversible muscarinic agonists","flip":"M1, M2, M3; not nicotinic · antagonist","why":"Reversible, so a muscarinic antagonist reverses an overdose."},{"id":"ip-e2chol:atropine","name":"Atropine","sec":"Cholinergic (muscarinic) drugs","line":"M1, M2, M3; not nicotinic · antagonist","ask":"M1, M2, M3 · antagonist · site: Central and periphery","key":"M1 + M2 + M3 · antagonist","cls":"Antagonist","rec":"M1, M2, M3; not nicotinic","soa":"Central and periphery","moa":"Non-selective, reversible (competitive) muscarinic antagonist","flip":"M1, M2, M3; not nicotinic · agonist","why":"The heart’s resting tone is PNS (M2), so blocking it raises HR."},{"id":"ip-e2chol:scop","name":"Scopolamine","sec":"Cholinergic (muscarinic) drugs","line":"Muscarinic, histamine and serotonin receptors · antagonist","ask":"Muscarinic, histamine and serotonin receptors · antagonist · site: CNS (penetrates faster than atropine) and periphery","key":"M1 + M2 + M3 · antagonist","cls":"Antagonist","rec":"Muscarinic, histamine and serotonin receptors","soa":"CNS (penetrates faster than atropine) and periphery","moa":"Antagonist","flip":"Muscarinic, histamine and serotonin receptors · agonist","why":"Blocking emesis is the goal; the rest of the anti-DUMBBELSS comes with it."},{"id":"ip-e2chol:benz","name":"Benztropine","sec":"Cholinergic (muscarinic) drugs","line":"M1 · antagonist","ask":"M1 · antagonist · site: CNS","key":"M1 · antagonist","cls":"Antagonist","rec":"M1","soa":"CNS","moa":"Atropine analog; antagonist more selective for brain M1","flip":"M1 · agonist","why":"Aimed at the brain’s M1, so less reaches the other muscarinic receptors."},{"id":"ip-e2chol:tropic","name":"Tropicamide","sec":"Cholinergic (muscarinic) drugs","line":"M3 · antagonist","ask":"M3 · antagonist · site: Eye","key":"M3 · antagonist","cls":"Antagonist","rec":"M3 (iris circular muscle)","soa":"Eye","moa":"Muscarinic antagonist","flip":"M3 · agonist","why":"With M3 blocked, the SNS α1 dilation of the pupil is unopposed."},{"id":"ip-e2chol:inhaled","name":"Ipratropium, tiotropium; aclidinium, umeclidinium","sec":"Cholinergic (muscarinic) drugs","line":"M3 in bronchial smooth muscle · antagonist","ask":"M3 in bronchial smooth muscle · antagonist · site: Lungs","key":"M3 · antagonist","cls":"Antagonist","rec":"M3 in bronchial smooth muscle","soa":"Lungs","moa":"Inhaled muscarinic antagonists; ipratropium short acting, tiotropium long acting; aclidinium and umeclidinium: high M3 affinity, slow dissociation","flip":"M3 in bronchial smooth muscle · agonist","why":"The lungs are PNS only: blocking M3 (Gq) removes the constriction, so the airway dilates."},{"id":"ip-e2chol:oab","name":"Oxybutynin, trospium, solifenacin","sec":"Cholinergic (muscarinic) drugs","line":"M3 · antagonist","ask":"M3 · antagonist · site: Bladder","key":"M3 · antagonist","cls":"Antagonist","rec":"M3 (oxybutynin also M1)","soa":"Bladder","moa":"Reversible muscarinic antagonists, more selective toward bladder M3","flip":"M3 · agonist","why":"Relaxing the bladder decreases urination (urgency, frequency, leakage)."},{"id":"ip-e2ind:cocaine","name":"Cocaine","sec":"Indirect-acting adrenergic drugs","line":"No receptor directly; more NE at every adrenergic receptor · indirect (reuptake block)","ask":"None directly · indirect or donor · site: Heart, blood vessels, CNS","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · reuptake block","rec":"None directly; more NE at every adrenergic receptor","soa":"Heart, blood vessels, CNS","moa":"NE reuptake inhibitor: complete NET blocker","why":"NE stays in the synapse, so it is more potent."},{"id":"ip-e2ind:amph","name":"Dextroamphetamine, amphetamine, lisdexamfetamine, methylphenidate, dexmethylphenidate","sec":"Indirect-acting adrenergic drugs","line":"No receptor directly · indirect (releaser, reuptake block, MAO inhibitor)","ask":"None directly · indirect or donor · site: CNS and periphery (↑SNS)","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · releaser, reuptake block, MAO inhibitor","rec":"None directly","soa":"CNS and periphery (↑SNS)","moa":"Primary: release of NE, dopamine and serotonin from the presynaptic terminal. Secondary (weak): reuptake block, MAO block","why":"Release is the main action; their reuptake block is weak."},{"id":"ip-e2ind:phenelzine","name":"Phenelzine","sec":"Indirect-acting adrenergic drugs","line":"No receptor directly · indirect (irreversible, MAO inhibitor)","ask":"None directly · indirect or donor · site: Brain and gut","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · irreversible, MAO inhibitor","rec":"None directly","soa":"Brain and gut","moa":"Irreversible, non-selective MAO-A and MAO-B inhibitor","why":"Gut MAO-A is blocked too, so tyramine is not broken down."},{"id":"ip-e2ind:selegiline","name":"Selegiline","sec":"Indirect-acting adrenergic drugs","line":"No receptor directly · indirect (irreversible, MAO inhibitor)","ask":"None directly · indirect or donor · site: Brain","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · irreversible, MAO inhibitor","rec":"None directly","soa":"Brain","moa":"Irreversible, selective MAO-B inhibitor (low doses)","why":"MAO-B is in the brain; the gut still breaks down tyramine."},{"id":"ip-e2alpha:phenyl","name":"Phenylephrine","sec":"α drugs","line":"α1 · agonist","ask":"α1 · agonist · site: Nasal vessels, eye, arteries and veins","key":"α1 · agonist","cls":"Agonist","rec":"α1 (Gq, ↑Ca++)","soa":"Nasal vessels, eye, arteries and veins","moa":"Selective α1 agonist","flip":"α1 · antagonist","why":"Constricting arteries raises afterload and constricting veins raises preload."},{"id":"ip-e2alpha:clon","name":"Clonidine (“-idine”)","sec":"α drugs","line":"α2 · agonist","ask":"α2 · agonist · site: Presynaptic nerve endings in the CNS","key":"α2 · agonist","cls":"Agonist","rec":"α2 (Gi, ↓cAMP)","soa":"Presynaptic nerve endings in the CNS","moa":"Selective α2 agonist","flip":"α2 · antagonist","why":"An agonist at an inhibitory receptor: it lowers NE release and sympathetic tone everywhere."},{"id":"ip-e2alpha:praz","name":"Prazosin (“-osin”: terazosin, doxazosin, tamsulosin)","sec":"α drugs","line":"α1 · antagonist","ask":"α1 · antagonist · site: Eye, nose, blood vessels (arteries and veins), urethra","key":"α1 · antagonist","cls":"Antagonist","rec":"α1","soa":"Eye, nose, blood vessels (arteries and veins), urethra","moa":"Selective, reversible α1 antagonist","flip":"α1 · agonist","why":"Less Gq → less Ca++ → vasodilation; it can be outcompeted by more NE."},{"id":"ip-e2alpha:pbz","name":"Phenoxybenzamine","sec":"α drugs","line":"α1, α2 · antagonist (irreversible)","ask":"α1, α2 · antagonist · site: Blood vessels, eye, GI tract","key":"α1 + α2 · antagonist","cls":"Antagonist · irreversible","rec":"α1, α2","soa":"Blood vessels, eye, GI tract","moa":"Irreversible (covalent), non-selective α1 and α2 antagonist","flip":"α1, α2 · agonist","why":"It cannot be outcompeted, so it gives the greatest drop in BP."},{"id":"ip-e2alpha:mirt","name":"Mirtazapine","sec":"α drugs","line":"α2, H1, muscarinic, α1 · antagonist","ask":"α2, H1, muscarinic, α1 · antagonist · site: CNS","key":"α2 · antagonist","cls":"Antagonist","rec":"α2, H1, muscarinic, α1","soa":"CNS","moa":"Antagonist at presynaptic α2 (also H1, muscarinic, α1)","flip":"α2, H1, muscarinic, α1 · agonist","why":"Blocking the α2 brake on release raises NE and serotonin."},{"id":"ip-e2beta:dobut","name":"Dobutamine","sec":"β drugs and the catecholamines","line":"β1 · agonist","ask":"β1 · agonist · site: Heart","key":"β1 · agonist","cls":"Agonist","rec":"β1 (Gs, ↑cAMP)","soa":"Heart","moa":"Selective β1 agonist","flip":"β1 · antagonist","why":"Continued stimulation down-regulates β1, so the dose keeps rising."},{"id":"ip-e2beta:terol","name":"Albuterol, levalbuterol, salmeterol, formoterol (“-terol”)","sec":"β drugs and the catecholamines","line":"β2 · agonist","ask":"β2 · agonist · site: Lungs, vessels, CNS","key":"β2 · agonist","cls":"Agonist","rec":"β2","soa":"Lungs, vessels, CNS","moa":"β2 agonists","flip":"β2 · antagonist","why":"Bronchodilation is the aim; what reaches the blood stimulates the heart and brain."},{"id":"ip-e2beta:mira","name":"Mirabegron","sec":"β drugs and the catecholamines","line":"β3 · agonist","ask":"β3 · agonist · site: Bladder","key":"β3 · agonist","cls":"Agonist","rec":"β3","soa":"Bladder","moa":"Selective β3 agonist","flip":"β3 · antagonist","why":"It relaxes the bladder through β3, not by blocking M3."},{"id":"ip-e2beta:iso","name":"Isoproterenol","sec":"β drugs and the catecholamines","line":"β1 = β2 · agonist","ask":"β1 = β2 · agonist · site: Heart, lungs, vessels","key":"β1 + β2 · agonist","cls":"Agonist","rec":"β1 = β2","soa":"Heart, lungs, vessels","moa":"Non-selective β agonist: “iso equal”","flip":"β1 = β2 · antagonist","why":"Its β1 action in the heart is why it was replaced for asthma."},{"id":"ip-e2beta:epi","name":"Epinephrine","sec":"β drugs and the catecholamines","line":"Low dose β1, β2; high dose also α1, α2 · agonist","ask":"Low dose β1, β2 · agonist · site: Heart and vasculature","key":"β1 + β2 · agonist","cls":"Agonist","rec":"Low dose β1, β2; high dose also α1, α2","soa":"Heart and vasculature","moa":"Agonist; affinity rank β1, β2 → α1 → α2","flip":"Low dose β1, β2; high dose also α1, α2 · antagonist","why":"At high dose α1 joins and overrides β2 in the vessels."},{"id":"ip-e2beta:ne","name":"Norepinephrine","sec":"β drugs and the catecholamines","line":"α1, β1 · agonist","ask":"α1, β1 · agonist · site: Heart and vasculature","key":"α1 + β1 · agonist","cls":"Agonist","rec":"α1, β1","soa":"Heart and vasculature","moa":"Agonist; highest affinity for α1 and β1 (can bind α2, β2)","flip":"α1, β1 · antagonist","why":"Without much β2 action, nothing offsets its α1 constriction."},{"id":"ip-e2beta:man","name":"Metoprolol, atenolol, nebivolol (“MAN”)","sec":"β drugs and the catecholamines","line":"β1 · antagonist","ask":"β1 · antagonist · site: Heart, kidney","key":"β1 · antagonist","cls":"Antagonist","rec":"β1","soa":"Heart, kidney","moa":"Selective β1 antagonists","flip":"β1 · agonist","why":"Sparing lung β2 makes them the choice in asthma."},{"id":"ip-e2beta:prop","name":"Propranolol (prototype), pindolol (partial agonist)","sec":"β drugs and the catecholamines","line":"β1, β2 · antagonist","ask":"β1, β2 · antagonist · site: Heart, kidney, lungs, vessels, brain","key":"β1 + β2 · antagonist","cls":"Antagonist","rec":"β1, β2","soa":"Heart, kidney, lungs, vessels, brain","moa":"Non-selective β antagonists","flip":"β1, β2 · agonist","why":"Blocking β2 in the lungs removes the dilation an asthmatic airway needs."},{"id":"ip-e2beta:carv","name":"Carvedilol, labetalol","sec":"β drugs and the catecholamines","line":"β1, β2, α1 · antagonist","ask":"β1, β2, α1 · antagonist · site: Heart, kidney, lungs, vessels","key":"α1 + β1 + β2 · antagonist","cls":"Antagonist","rec":"β1, β2, α1","soa":"Heart, kidney, lungs, vessels","moa":"β and α1 antagonists","flip":"β1, β2, α1 · agonist","why":"They lower both terms of MAP = CO × TPR."},{"id":"ip-e2no:nitrate","name":"Nitroglycerin, nitroprusside, isosorbide","sec":"Nitric oxide drugs","line":"No receptor; sGC in vascular smooth muscle · donor (NO donor)","ask":"None · indirect or donor · site: Vascular smooth muscle","key":"no receptor of its own · indirect or donor","cls":"Donor · NO donor","rec":"None; sGC in vascular smooth muscle","soa":"Vascular smooth muscle","moa":"NO donors: NO → soluble guanylyl cyclase (sGC) → ↑cGMP","why":"Their NO bypasses the endothelial M3 and NOS steps."},{"id":"ip-e2no:pde","name":"Sildenafil, tadalafil","sec":"Nitric oxide drugs","line":"No receptor; PDE enzyme · indirect (PDE inhibitor)","ask":"None · indirect or donor · site: Vascular smooth muscle","key":"no receptor of its own · indirect or donor","cls":"Indirect (enzyme, transporter or release) · PDE inhibitor","rec":"None; PDE enzyme","soa":"Vascular smooth muscle","moa":"Phosphodiesterase (PDE) inhibitors: cGMP is not broken down","why":"More cGMP from each NO molecule: PDE inhibitors increase the potency of NO."},{"id":"ip-e2raas:alis","name":"Aliskiren","sec":"Renin–angiotensin–aldosterone system (RAAS) drugs","line":"No receptor; the renin enzyme · antagonist (renin inhibitor)","ask":"None · antagonist · site: Blood (plasma renin)","key":"no receptor of its own · antagonist","cls":"Antagonist · renin inhibitor","rec":"None; the renin enzyme","soa":"Blood (plasma renin)","moa":"Selective, reversible renin inhibitor","why":"Renin is the rate-limiting first step, so everything downstream falls."},{"id":"ip-e2raas:acei","name":"Captopril, enalapril, lisinopril (“-pril”)","sec":"Renin–angiotensin–aldosterone system (RAAS) drugs","line":"No receptor; the ACE enzyme · antagonist (ACE inhibitor)","ask":"None · antagonist · site: Blood","key":"no receptor of its own · antagonist","cls":"Antagonist · ACE inhibitor","rec":"None; the ACE enzyme","soa":"Blood","moa":"Selective, reversible angiotensin-converting enzyme (ACE) inhibitors","why":"ACE also breaks down bradykinin, so bradykinin builds up."},{"id":"ip-e2raas:arb","name":"Losartan, valsartan (“-sartan”)","sec":"Renin–angiotensin–aldosterone system (RAAS) drugs","line":"AT1 · antagonist","ask":"AT1 · antagonist · site: Blood stream","key":"AT1 · antagonist","cls":"Antagonist","rec":"AT1","soa":"Blood stream; AT1 in arteries and veins","moa":"Angiotensin II receptor blockers (ARBs), 10,000-fold AT1 over AT2","flip":"AT1 · agonist","why":"AT2 is left open, so angiotensin II activates more of it."},{"id":"ip-e2raas:mra","name":"Spironolactone, eplerenone","sec":"Renin–angiotensin–aldosterone system (RAAS) drugs","line":"MR · antagonist","ask":"MR · antagonist · site: Late distal tubule and collecting duct","key":"MR · antagonist","cls":"Antagonist","rec":"MR","soa":"Late distal tubule and collecting duct","moa":"Mineralocorticoid receptor (MR) antagonists: aldosterone antagonists, potassium-sparing diuretics","flip":"MR · agonist","why":"Without aldosterone’s signal, Na+ is lost and K+ is kept."}]},{"id":"ip-pt","tab":"Poisoning table","title":"Poisoning table","intro":"The professor's Poisoning Treatment Table 2026 key, row by row, in the professor's wording. Pick a mode; a miss comes back at the end of the round and leads the next one.","cite":"PoisoningTreatmentTable2026KEY.pdf, the professor's posted key (pages 1–3)","name":"poison","columns":[["sym","Symptoms of acute poisoning / diagnostic methods"],["antidotes","Antidote(s)"],["moa","MOA of antidote(s)"],["special_q","Special considerations: the question"],["special","Special considerations: the professor's answer"],["ref","Reference column"]],"covers":[["all","Cover every cell",["sym","antidotes","moa","special"]],["antimoa","Cover antidote + mechanism",["antidotes","moa"]],["sym","Cover symptoms",["sym"]]],"modes":[{"id":"anti","label":"Name the antidote","ask":"poison","answer":"antidotes","prompt":"Antidote(s) in the professor's table?"},{"id":"moa","label":"Name the mechanism","ask":["antidote","poison_od"],"answer":"mechanism","prompt":"Mechanism of this antidote in the professor's table?"},{"id":"poison","label":"Name the poison","ask":"sym","answer":"poison","prompt":"Which overdose has these symptoms or diagnostic methods in the professor's table?"},{"id":"special","label":"The professor's special questions","ask":"special_ask","answer":"special","prompt":"The professor's answer in the key?"}],"rows":[{"id":"ip-apap","poison":"Acetaminophen","poison_od":"Acetaminophen overdose","sym":"Nausea/vomiting. Clinical signs of liver failure. Acetaminophen levels can be measured in the blood.","antidotes":"N-acetylcysteine","moa":"Replenishes glutathione","ref":"Marraffa article","antidote":["N-acetylcysteine"],"mechanism":["Replenishes glutathione"],"special_q":"At what time after OD does the antidote lose effectiveness? Should you still give it past that time point?","special":"About 8 hours after overdose. Yes","special_ask":"Acetaminophen: At what time after OD does the antidote lose effectiveness? Should you still give it past that time point?"},{"id":"ip-alc","poison":"Toxic alcohols","poison_od":"Toxic alcohols overdose","sym":"Methanol active metabolites can cause anion-gap metabolic acidosis and ocular toxicity. Ethylene glycol active metabolites can crystalize in the microvasculature; renal toxicity is common.","antidotes":"Ethanol or fomepizole","moa":"Inhibition of alcohol dehydrogenase","ref":"Marraffa article","antidote":["Ethanol or fomepizole"],"mechanism":["Inhibition of alcohol dehydrogenase"],"special_q":"There are two possible treatments. Is there an advantage of one therapy over the other? Why?","special":"Fomepizole is stronger Alc Dehydrogenase inhibitor and has fewer adverse effects than ethanol.","special_ask":"Toxic alcohols: There are two possible treatments. Is there an advantage of one therapy over the other? Why?"},{"id":"ip-bzd","poison":"Benzodiazepines","poison_od":"Benzodiazepines overdose","sym":"CNS depression and relatively normal vitals. Benzodiazepine levels can be measured in the blood.","antidotes":"Flumazenil","moa":"Competitive antagonist of benzodiazepine receptor","ref":"Marraffa article","antidote":["Flumazenil"],"mechanism":["Competitive antagonist of benzodiazepine receptor"],"special_q":"What are some concerns when choosing to use this antidote?","special":"Flumazenil can cause withdrawal symptoms in a benzodiazepine dependent patient.","special_ask":"Benzodiazepines: What are some concerns when choosing to use this antidote?"},{"id":"ip-bb","poison":"Beta blockers","poison_od":"Beta blockers overdose","sym":"Hypotension, bradycardia, altered mental status, respiratory depression","antidotes":"Atropine; Calcium; Glucagon; HIET; Vasopressors; IV FE","moa":"Atropine: Increase heart rate. · Calcium: Try to drive calcium into cardiac cells · Glucagon: Increase cardiac cellular cAMP to increase heart rate · HIET: Mechanisms of inotropic effects not understood. · Vasopressors: Increase blood pressure. · IV FE: Acts as a sink for the drug if the drug is lipophilic enough.","ref":"Marraffa article","antidote":["Atropine","Calcium","Glucagon","HIET","Vasopressors","IV FE (i.v. 20% fatty acid emulsion)"],"mechanism":["Increase heart rate.","Try to drive calcium into cardiac cells","Increase cardiac cellular cAMP to increase heart rate","Mechanisms of inotropic effects not understood.","Increase blood pressure.","Acts as a sink for the drug if the drug is lipophilic enough."],"special_q":"What can distinguish between Beta Blocker OD compared to Calcium Channel Blocker OD?","special":"BB OD may have altered mental status.","special_ask":"Beta blockers: What can distinguish between Beta Blocker OD compared to Calcium Channel Blocker OD?"},{"id":"ip-ccb","poison":"Calcium channel blockers","poison_od":"Calcium channel blockers overdose","sym":"Hypotension, bradycardia, but often alert.","antidotes":"Atropine; Calcium; Glucagon; HIET; Vasopressors; IV FE","moa":"Same as above for BB OD.","ref":"Marraffa article"},{"id":"ip-dig","poison":"Digoxin","poison_od":"Digoxin overdose","sym":"Bradycardia, arrythmias, elevated serum potassium, nausea/vomiting. Digoxin levels can be measured in the blood.","antidotes":"Digoxin specific antibody fragments","moa":"Binds digoxin, will be renally eliminated","ref":"Marraffa article","antidote":["Digoxin specific antibody fragments"],"mechanism":["Binds digoxin, will be renally eliminated"],"special_q":"Once you give the antidote, why is checking serum digoxin concentrations not helpful?","special":"The total dig concentration (Free and bound to Fab) will be increased; can’t use this measurement to calculate more Fab doses.","special_ask":"Digoxin: Once you give the antidote, why is checking serum digoxin concentrations not helpful?"},{"id":"ip-tca","poison":"Tricyclic Antidepressants","poison_od":"Tricyclic Antidepressants overdose","sym":"tachycardia, dilated pupils, dry mouth, agitation, seizures, sometimes vasodilation, elongated QRS interval, reduced cardiac contractility","antidotes":"Intravenous fluids, dopamine or norepinephrine, sodium bicarbonate for elongated QRS interval","moa":"These options are mostly supportive care, trying to maintain blood pressure. Sodium bicarbonate counteracts the inhibition on sodium cardiac channels","ref":"Basic and Clinical Pharmacology, Chapt 58","antidote":["Intravenous fluids, dopamine or norepinephrine, sodium bicarbonate for elongated QRS interval"],"mechanism":["These options are mostly supportive care, trying to maintain blood pressure. Sodium bicarbonate counteracts the inhibition on sodium cardiac channels"]},{"id":"ip-opi","poison":"Opioids","poison_od":"Opioids overdose","sym":"Somnolence, coma, decreased heart and breath rates, decrease pupils","antidotes":"Naloxone","moa":"Competitive antagonist of opioid receptors","ref":"Marraffa article","antidote":["Naloxone"],"mechanism":["Competitive antagonist of opioid receptors"],"special_q":"What is a concern when using this antidote in chronic opioid users?","special":"It can trigger withdrawal","special_ask":"Opioids: What is a concern when using this antidote in chronic opioid users?"},{"id":"ip-sal","poison":"Salicylates","poison_od":"Salicylates overdose","sym":"hyperventilation and respiratory alkalosis then metabolic acidosis, hyperthermia, confusion and seizures","antidotes":"Supportive care, IV Sodium bicarbonate","moa":"Renal ion trapping to enhance elimination","ref":"Basic and Clinical Pharmacology, Chapt 58","antidote":["Supportive care, IV Sodium bicarbonate"],"mechanism":["Renal ion trapping to enhance elimination"]},{"id":"ip-su","poison":"Sulfonylureas and miglitinide","poison_od":"Sulfonylureas and miglitinide overdose","sym":"hypoglycemia","antidotes":"octreotide","moa":"Inhibits insulin release from the pancreas","ref":"Marraffa article","antidote":["octreotide"],"mechanism":["Inhibits insulin release from the pancreas"]},{"id":"ip-fe","poison":"Iron","poison_od":"Iron overdose","sym":"Vomiting, abdominal pain, and diarrhea within 1 to 6 hours. Lethargy, coma, seizures, bloody vomiting, bloody diarrhea, and shock within 6 to 24 hours. Hypotension and tachycardia within 6 to 24 hours. Liver dysfunction and failure possible in 2 to 5 days.","antidotes":"Deferoxamine","moa":"Chelates the circulating ferric iron","ref":"Pharmacotherapy: A Pathophysiologic Approach, 13th Ed. Chapt e6","antidote":["Deferoxamine"],"mechanism":["Chelates the circulating ferric iron"]},{"id":"ip-op","poison":"Organophosphate Insecticides","poison_od":"Organophosphate Insecticides overdose","sym":"Acetylcholine excess: SLUDGE or DUMBELLS","antidotes":"Atropine; Pralidoxime","moa":"Atropine: Muscarinic acetylcholine receptor antagonist · Pralidoxime: Removes OP from acetylcholinesterase","ref":"Pharmacotherapy: A Pathophysiologic Approach, 13th Ed. Chapt e6","antidote":["Atropine","Pralidoxime"],"mechanism":["Muscarinic acetylcholine receptor antagonist","Removes OP from acetylcholinesterase"]}]}],"expect":{"pt":{"anti":[["Acetaminophen","N-acetylcysteine"],["Toxic alcohols","Ethanol or fomepizole"],["Benzodiazepines","Flumazenil"],["Beta blockers","Atropine; Calcium; Glucagon; HIET; Vasopressors; IV FE"],["Calcium channel blockers","Atropine; Calcium; Glucagon; HIET; Vasopressors; IV FE"],["Digoxin","Digoxin specific antibody fragments"],["Tricyclic Antidepressants","Intravenous fluids, dopamine or norepinephrine, sodium bicarbonate for elongated QRS interval"],["Opioids","Naloxone"],["Salicylates","Supportive care, IV Sodium bicarbonate"],["Sulfonylureas and miglitinide","octreotide"],["Iron","Deferoxamine"],["Organophosphate Insecticides","Atropine; Pralidoxime"]],"moa":[["N-acetylcysteine · Acetaminophen overdose","Replenishes glutathione"],["Ethanol or fomepizole · Toxic alcohols overdose","Inhibition of alcohol dehydrogenase"],["Flumazenil · Benzodiazepines overdose","Competitive antagonist of benzodiazepine receptor"],["Atropine · Beta blockers overdose","Increase heart rate."],["Calcium · Beta blockers overdose","Try to drive calcium into cardiac cells"],["Glucagon · Beta blockers overdose","Increase cardiac cellular cAMP to increase heart rate"],["HIET · Beta blockers overdose","Mechanisms of inotropic effects not understood."],["Vasopressors · Beta blockers overdose","Increase blood pressure."],["IV FE (i.v. 20% fatty acid emulsion) · Beta blockers overdose","Acts as a sink for the drug if the drug is lipophilic enough."],["Digoxin specific antibody fragments · Digoxin overdose","Binds digoxin, will be renally eliminated"],["Intravenous fluids, dopamine or norepinephrine, sodium bicarbonate for elongated QRS interval · Tricyclic Antidepressants overdose","These options are mostly supportive care, trying to maintain blood pressure. Sodium bicarbonate counteracts the inhibition on sodium cardiac channels"],["Naloxone · Opioids overdose","Competitive antagonist of opioid receptors"],["Supportive care, IV Sodium bicarbonate · Salicylates overdose","Renal ion trapping to enhance elimination"],["octreotide · Sulfonylureas and miglitinide overdose","Inhibits insulin release from the pancreas"],["Deferoxamine · Iron overdose","Chelates the circulating ferric iron"],["Atropine · Organophosphate Insecticides overdose","Muscarinic acetylcholine receptor antagonist"],["Pralidoxime · Organophosphate Insecticides overdose","Removes OP from acetylcholinesterase"]],"poison":[["Nausea/vomiting. Clinical signs of liver failure. Acetaminophen levels can be measured in the blood.","Acetaminophen"],["Methanol active metabolites can cause anion-gap metabolic acidosis and ocular toxicity. Ethylene glycol active metabolites can crystalize in the microvasculature; renal toxicity is common.","Toxic alcohols"],["CNS depression and relatively normal vitals. Benzodiazepine levels can be measured in the blood.","Benzodiazepines"],["Hypotension, bradycardia, altered mental status, respiratory depression","Beta blockers"],["Hypotension, bradycardia, but often alert.","Calcium channel blockers"],["Bradycardia, arrythmias, elevated serum potassium, nausea/vomiting. Digoxin levels can be measured in the blood.","Digoxin"],["tachycardia, dilated pupils, dry mouth, agitation, seizures, sometimes vasodilation, elongated QRS interval, reduced cardiac contractility","Tricyclic Antidepressants"],["Somnolence, coma, decreased heart and breath rates, decrease pupils","Opioids"],["hyperventilation and respiratory alkalosis then metabolic acidosis, hyperthermia, confusion and seizures","Salicylates"],["hypoglycemia","Sulfonylureas and miglitinide"],["Vomiting, abdominal pain, and diarrhea within 1 to 6 hours. Lethargy, coma, seizures, bloody vomiting, bloody diarrhea, and shock within 6 to 24 hours. Hypotension and tachycardia within 6 to 24 hours. Liver dysfunction and failure possible in 2 to 5 days.","Iron"],["Acetylcholine excess: SLUDGE or DUMBELLS","Organophosphate Insecticides"]],"special":[["Acetaminophen: At what time after OD does the antidote lose effectiveness? Should you still give it past that time point?","About 8 hours after overdose. Yes"],["Toxic alcohols: There are two possible treatments. Is there an advantage of one therapy over the other? Why?","Fomepizole is stronger Alc Dehydrogenase inhibitor and has fewer adverse effects than ethanol."],["Benzodiazepines: What are some concerns when choosing to use this antidote?","Flumazenil can cause withdrawal symptoms in a benzodiazepine dependent patient."],["Beta blockers: What can distinguish between Beta Blocker OD compared to Calcium Channel Blocker OD?","BB OD may have altered mental status."],["Digoxin: Once you give the antidote, why is checking serum digoxin concentrations not helpful?","The total dig concentration (Free and bound to Fab) will be increased; can’t use this measurement to calculate more Fab doses."],["Opioids: What is a concern when using this antidote in chronic opioid users?","It can trigger withdrawal"]]},"rx":{"ip-e2nmj:varen":["Nn, α4/β2 · agonist (partial)","Nn, α4/β2 · antagonist","Nn · agonist"],"ip-e2nmj:sch":["Nm · agonist (depolarizing)","Nm · antagonist","Nm · agonist"],"ip-e2nmj:curare":["Nm · antagonist (non-depolarizing)","Nm · agonist","Nm · antagonist"],"ip-e2nmj:neo":["No receptor directly; more ACh at muscarinic and nicotinic receptors · indirect (AChE inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2nmj:physo":["No receptor directly; more ACh everywhere · indirect (AChE inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2nmj:organo":["No receptor directly; more ACh everywhere · indirect (irreversible, AChE inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2nmj:botox":["No receptor · antagonist (blocks ACh release)",null,"no receptor of its own · antagonist"],"ip-e2chol:ach":["Nn, Nm, M1, M2, M3 · agonist","Nn, Nm, M1, M2, M3 · antagonist","M1 + M2 + M3 + Nn + Nm · agonist"],"ip-e2chol:musc":["M1, M2, M3; not nicotinic · agonist","M1, M2, M3; not nicotinic · antagonist","M1 + M2 + M3 · agonist"],"ip-e2chol:atropine":["M1, M2, M3; not nicotinic · antagonist","M1, M2, M3; not nicotinic · agonist","M1 + M2 + M3 · antagonist"],"ip-e2chol:scop":["Muscarinic, histamine and serotonin receptors · antagonist","Muscarinic, histamine and serotonin receptors · agonist","M1 + M2 + M3 · antagonist"],"ip-e2chol:benz":["M1 · antagonist","M1 · agonist","M1 · antagonist"],"ip-e2chol:tropic":["M3 · antagonist","M3 · agonist","M3 · antagonist"],"ip-e2chol:inhaled":["M3 in bronchial smooth muscle · antagonist","M3 in bronchial smooth muscle · agonist","M3 · antagonist"],"ip-e2chol:oab":["M3 · antagonist","M3 · agonist","M3 · antagonist"],"ip-e2ind:cocaine":["No receptor directly; more NE at every adrenergic receptor · indirect (reuptake block)",null,"no receptor of its own · indirect or donor"],"ip-e2ind:amph":["No receptor directly · indirect (releaser, reuptake block, MAO inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2ind:phenelzine":["No receptor directly · indirect (irreversible, MAO inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2ind:selegiline":["No receptor directly · indirect (irreversible, MAO inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2alpha:phenyl":["α1 · agonist","α1 · antagonist","α1 · agonist"],"ip-e2alpha:clon":["α2 · agonist","α2 · antagonist","α2 · agonist"],"ip-e2alpha:praz":["α1 · antagonist","α1 · agonist","α1 · antagonist"],"ip-e2alpha:pbz":["α1, α2 · antagonist (irreversible)","α1, α2 · agonist","α1 + α2 · antagonist"],"ip-e2alpha:mirt":["α2, H1, muscarinic, α1 · antagonist","α2, H1, muscarinic, α1 · agonist","α2 · antagonist"],"ip-e2beta:dobut":["β1 · agonist","β1 · antagonist","β1 · agonist"],"ip-e2beta:terol":["β2 · agonist","β2 · antagonist","β2 · agonist"],"ip-e2beta:mira":["β3 · agonist","β3 · antagonist","β3 · agonist"],"ip-e2beta:iso":["β1 = β2 · agonist","β1 = β2 · antagonist","β1 + β2 · agonist"],"ip-e2beta:epi":["Low dose β1, β2; high dose also α1, α2 · agonist","Low dose β1, β2; high dose also α1, α2 · antagonist","β1 + β2 · agonist"],"ip-e2beta:ne":["α1, β1 · agonist","α1, β1 · antagonist","α1 + β1 · agonist"],"ip-e2beta:man":["β1 · antagonist","β1 · agonist","β1 · antagonist"],"ip-e2beta:prop":["β1, β2 · antagonist","β1, β2 · agonist","β1 + β2 · antagonist"],"ip-e2beta:carv":["β1, β2, α1 · antagonist","β1, β2, α1 · agonist","α1 + β1 + β2 · antagonist"],"ip-e2no:nitrate":["No receptor; sGC in vascular smooth muscle · donor (NO donor)",null,"no receptor of its own · indirect or donor"],"ip-e2no:pde":["No receptor; PDE enzyme · indirect (PDE inhibitor)",null,"no receptor of its own · indirect or donor"],"ip-e2raas:alis":["No receptor; the renin enzyme · antagonist (renin inhibitor)",null,"no receptor of its own · antagonist"],"ip-e2raas:acei":["No receptor; the ACE enzyme · antagonist (ACE inhibitor)",null,"no receptor of its own · antagonist"],"ip-e2raas:arb":["AT1 · antagonist","AT1 · agonist","AT1 · antagonist"],"ip-e2raas:mra":["MR · antagonist","MR · agonist","MR · antagonist"]},"pairDrugs":32}};

const SHOTS = process.env.PUD_SHOTS || '';
const DENY = () => { const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if(window.__deny === 'denied') throw new DOMException('The operation is insecure.', 'SecurityError');
    if(window.__deny === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return orig.call(this, k, v); }; };

/* `near`: the answers after the item's own and its alts come from items with the same `near` value first */
function nearBad(S, tables){
  const bad = []; let n = 0;
  for(const t of tables) for(const m of t.modes){
    if(!m.near) continue;
    const all = S.items(t, m);
    for(const it of all){
      n++;
      const o = S.options(t, m, it, all), alts = new Set(m.alts ? [].concat(it.row[m.alts] || []) : []);
      let pool = all.filter(x => x.id !== it.id);
      if(m.distinct) pool = pool.filter(x => x.row[m.distinct] !== it.row[m.distinct]);
      const same = new Set(pool.filter(x => x.row[m.near] === it.row[m.near]).map(x => x.ans));
      same.delete(it.ans); alts.forEach(a => same.delete(a));
      const extra = o.filter(a => a !== it.ans && !alts.has(a));
      if(extra.filter(a => same.has(a)).length !== Math.min(extra.length, same.size)) bad.push(`${t.id}/${m.id}/${it.id}`);
    }
  }
  return {bad, n};
}

/* The scratch course's data: Intro to Pharmacology's sets and tables, in place of
   any the course has; `mutate(sets, tables)` changes them for a refusal. */
function fixtureFiles(own, mutate){
  const sets = JSON.parse(JSON.stringify(IP.pairSets)), tables = JSON.parse(JSON.stringify(IP.tables));
  if(mutate) mutate(sets, tables);
  const decl = (name, v, has) => v === null ? '' : has ? `${name}.splice(0, ${name}.length, ...${JSON.stringify(v)});\n` : `const ${name} = ${JSON.stringify(v)};\n`;
  return {'pairup_test_data.js': '/* Intro to Pharmacology\'s Pair up sets, drug table and poisoning table (929cd62), added by the pair-up-drills test */\n' +
    decl('PAIR_SETS', sets, own.PAIR_SETS) + decl('RECALL_TABLES', tables, own.RECALL_TABLES)};
}
const courseLine = "COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).filter(f => f !== 'pairup_test_data.js').concat(['pairup_test_data.js']);";

/* every item of every mode: its number of different answers, its own among them, no other right answer, its alts */
function badOptions(S, tables){
  const bad = []; let n = 0;
  for(const t of tables) for(const m of t.modes){
    const all = S.items(t, m), answers = new Set(all.map(x => x.ans));
    for(const it of all){
      n++;
      const o = S.options(t, m, it, all), want = Math.min(m.options || 5, m.distinct ? 1 + new Set(all.filter(x => x.row[m.distinct] !== it.row[m.distinct]).map(x => x.ans)).size : answers.size);
      const alts = m.alts ? [].concat(it.row[m.alts] || []) : [];
      const other = m.distinct ? o.filter(a => a !== it.ans && all.some(x => x.ans === a && x.row[m.distinct] === it.row[m.distinct])) : [];
      if(o.length !== want || new Set(o).size !== o.length || !o.includes(it.ans) || other.length || !alts.every(a => o.includes(a))) bad.push(`${t.id}/${m.id}/${it.id}`);
    }
  }
  return {bad, n};
}

(async () => {
  if(!IP) L.notRun(NAME, 'the fixture line is empty: run port_from_ip.js');
  console.log('\n=== the course\'s own sets and tables ===');
  L.PAGE.need(NAME);
  const X = L.engine('({PAIR_SETS: typeof PAIR_SETS === "undefined" ? null : PAIR_SETS, RECALL_TABLES: typeof RECALL_TABLES === "undefined" ? null : RECALL_TABLES, COURSE, FX: typeof FX === "undefined" ? null : FX})');
  const S = X.FX && X.FX.api('pair-up-drills');
  if(!check(!!S, 'the page carries pair-up-drills, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const ownT = X.RECALL_TABLES || [];
  if(ownT.length){ const r = badOptions(S, ownT); check(!r.bad.length, `every item of the course's tables is offered its answers, its own among them, no second right one (${r.n} items in ${ownT.length} tables)`, r.bad.slice(0, 6).join(', ')); }
  else L.skip('every item of the course\'s tables is offered its answers', 'the course has no RECALL_TABLES');
  const own = {PAIR_SETS: !!X.PAIR_SETS, RECALL_TABLES: !!X.RECALL_TABLES};

  console.log('\n=== on Intro to Pharmacology\'s own data ===');
  const [RXT, PTT] = IP.tables;
  const ptSame = Object.keys(IP.expect.pt).filter(k => { const m = PTT.modes.find(x => x.id === k); return JSON.stringify(S.items(PTT, m).map(x => [x.ask, x.ans])) !== JSON.stringify(IP.expect.pt[k]); });
  check(!ptSame.length, `the poisoning table's items in the four modes are Intro to Pharmacology's own (${Object.values(IP.expect.pt).map(v => v.length).join(', ')} items)`, ptSame.join(', '));
  const rec = RXT.modes.find(m => m.id === 'rec'), drugM = RXT.modes.find(m => m.id === 'drug');
  const recItems = S.items(RXT, rec), drugItems = S.items(RXT, drugM);
  const recBad = recItems.filter(it => { const o = S.options(RXT, rec, it, recItems), e = IP.expect.rx[it.row.id];
    return o.length !== 5 || new Set(o).size !== 5 || it.ans !== e[0] || !o.includes(e[0]) || (e[1] && !o.includes(e[1])) || o.some(t => /^None/.test(t)); }).map(x => x.id);
  check(recItems.length === 39 && !recBad.length, `Name the receptor: each of the ${recItems.length} drugs gets five different lines, the table's own and its flipped twin among them, no "None"`, recBad.slice(0, 5).join(', '));
  const drugBad = drugItems.filter(it => { const o = S.options(RXT, drugM, it, drugItems), key = IP.expect.rx[it.row.id][2];
    return o.length !== 4 || !o.includes(it.ans) || o.filter(a => a !== it.ans).some(a => IP.expect.rx[RXT.rows.find(r => r.name === a).id][2] === key); }).map(x => x.id);
  check(drugItems.length === 39 && !drugBad.length, 'Name the drug: four drugs each, none of the others with the same receptor and action', drugBad.slice(0, 5).join(', '));
  check(IP.pairSets.find(s => s.id === 'ip-drug').pairs.length === IP.expect.pairDrugs, `the Pair up drug set has the ${IP.expect.pairDrugs} rows Intro to Pharmacology's pairDrugs builds`);
  { const r = badOptions(S, IP.tables); check(!r.bad.length, `every item of its two tables is offered its answers, its own among them (${r.n} items)`, r.bad.slice(0, 6).join(', ')); }
  { const r = nearBad(S, IP.tables); check(r.n === 78 && !r.bad.length, `after its own line and its flipped twin, each drug is offered the lines or drugs of its own section first (${r.n} items in the modes with \`near\`)`, r.bad.slice(0, 6).join(', ')); }

  console.log('\n=== the build step stops on bad data ===');
  const refusals = [
    ['no PAIR_SETS and no RECALL_TABLES', {files: {'pairup_test_data.js': '/* nothing */\n'}, none: true}, /reads PAIR_SETS or RECALL_TABLES/],
    ['a box twice in a one-chip-per-box set', {mutate: s => { s[0].pairs[1][1] = s[0].pairs[0][1]; }}, /is there twice in a one-chip-per-box set/],
    ['a mode naming a column no row has', {mutate: (s, t) => { t[1].modes[0].answer = 'nowhere'; }}, /answer "nowhere" is in no row/],
    ['list cells of different lengths in one row', {mutate: (s, t) => { t[1].rows[3].mechanism.pop(); }}, /lists of different lengths/],
    ['an HTML tag in a cell', {mutate: (s, t) => { t[0].rows[0].moa = '<b>Partial</b> agonist'; }}, /carries an HTML tag/]];
  for(const [label, o, want] of refusals){
    // with no data: the course's own files that declare PAIR_SETS or RECALL_TABLES are taken out of course.js `files` in the copy
    const edit = o.none ? src => { const decl = /\b(const|let|var)\s+(PAIR_SETS|RECALL_TABLES)\b/;
      const drop = fs.readdirSync(src).filter(f => f.endsWith('.js') && f !== 'pairup_test_data.js' && decl.test(fs.readFileSync(path.join(src, f), 'utf8')));
      if(drop.length) fs.appendFileSync(path.join(src, 'course.js'), `\n;COURSE.files = COURSE.files.filter(f => !${JSON.stringify(drop)}.includes(f));\n`); } : null;
    const r = L.scratchBuild('pairup-refuse', {files: o.files || fixtureFiles(own, o.mutate), courseLine, edit});
    check(r.code !== 0 && want.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  console.log('\n=== on a scratch copy with Intro to Pharmacology\'s sets and tables (Chromium) ===');
  const s = L.scratchBuild('pairup', {files: fixtureFiles(own), courseLine});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test data does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}});
    const ev = (f, a) => page.evaluate(f, a);
    const settle = () => page.waitForTimeout(370);   // a tap within 350 ms of a card being drawn is not taken
    const nav = await ev(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));
    check(nav.includes('pairup') && nav.includes('rt-ip-rx') && nav.includes('rt-ip-pt') && nav.indexOf('rt-ip-pt') < nav.indexOf('settings'),
          'the nav has Pair up and one tab per table, before Settings', nav.join(' '));

    console.log('  -- Pair up --');
    await page.click('#nav button[data-v="pairup"]');
    const p0 = await ev(() => ({chips: document.querySelectorAll('#v-pairup #ptray .pchip').length, boxes: document.querySelectorAll('#v-pairup .ptarget').length,
      sets: document.querySelectorAll('#v-pairup [data-pset]').length, set: FX.api('pair-up-drills').pair().set}));
    check(p0.set === 'ip-rec' && p0.chips === 7 && p0.boxes === 7 && p0.sets === 5, 'a 14-pair set is served 7 chips and their 7 boxes; the 5 sets are offered', p0);
    const round = await ev(() => FX.api('pair-up-drills').pair().round.map(p => [p[0], p[1]]));
    const chipSel = n => `#v-pairup .pchip[data-pc="${n.replace(/"/g, '\\"')}"]`, boxSel = n => `#v-pairup .ptarget[data-pt="${n.replace(/"/g, '\\"')}"]`, boxAt = n => boxSel(n) + ' .pl';   // a box is tapped on its label, not on a chip inside it
    // the first chip by tap, tap; the second dragged; the last put in the first chip's box (wrong)
    await page.click(chipSel(round[0][0])); await page.click(boxAt(round[0][1]));
    const t1 = await ev(n => FX.api('pair-up-drills').pair().placed[n], round[0][0]);
    check(t1 === round[0][1], 'a chip tapped and then a box tapped is placed in that box', t1);
    { const a = await page.locator(chipSel(round[1][0])).boundingBox(), b = await page.locator(boxSel(round[1][1])).boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
      await page.mouse.move(a.x + 30, a.y + 30, {steps: 4}); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, {steps: 8}); await page.mouse.up(); }
    check(await ev(n => FX.api('pair-up-drills').pair().placed[n], round[1][0]) === round[1][1], 'a chip dragged onto a box is placed there');
    await page.click(chipSel(round[1][0]));
    check(!(await ev(n => FX.api('pair-up-drills').pair().placed[n], round[1][0])) && await ev(n => !!document.querySelector(`#v-pairup #ptray .pchip[data-pc="${n}"]`), round[1][0]),
          'a chip tapped in a box returns to the tray');
    await page.click(chipSel(round[1][0])); await page.click(boxAt(round[0][1]));
    const swap = await ev(([a, b]) => { const P = FX.api('pair-up-drills').pair().placed; return [P[a] || null, P[b] || null]; }, [round[0][0], round[1][0]]);
    check(swap[0] === null && swap[1] === round[0][1], 'a second chip put in a taken box sends the first back to the tray', swap);
    // now all right but the last, which goes into the first chip's box... as the only wrong one
    await page.click(chipSel(round[1][0]));
    for(let i = 0; i < 6; i++){ await page.click(chipSel(round[i][0])); await page.click(boxAt(round[i][1])); }
    await page.click(chipSel(round[6][0])); await page.click(boxAt(round[5][1]));   // takes the 6th box; the 6th chip goes back
    await page.click(chipSel(round[5][0])); await page.click(boxAt(round[6][1]));   // the 6th chip in the 7th box: both wrong
    await page.click('#v-pairup #pcheck');
    const c1 = await ev(() => ({score: document.querySelector('#v-pairup #pscore').textContent, rows: [...document.querySelectorAll('#v-pairup .pfbr')].map(r => r.className.replace('pfbr ', '')),
      first: (document.querySelector('#v-pairup .pfbr') || {}).textContent || '', okChips: document.querySelectorAll('#v-pairup .pchip.ok').length,
      badChips: document.querySelectorAll('#v-pairup .pchip.bad').length, best: (DB.pairup || {}).best && DB.pairup.best['pair:ip-rec']}));
    check(c1.score === '5 of 7 right' && c1.okChips === 5 && c1.badChips === 2, 'Check marks every chip: 5 right, 2 wrong', c1);
    const why6 = IP.pairSets[0].pairs.find(p => p[0] === round[5][0])[2], why7 = IP.pairSets[0].pairs.find(p => p[0] === round[6][0])[2];
    check(c1.rows.slice(0, 2).every(c => c === 'bad') && c1.rows.length === 7 && /was put under/.test(c1.first) && /it belongs under/.test(c1.first) &&
          (c1.first.includes(why6) || c1.first.includes(why7)), 'the wrong chips come first, each with where it was put, where it belongs and why', c1.first.slice(0, 160));
    check(c1.best === '5/7', 'the best score is kept in the progress (DB.pairup)', c1.best);
    if(SHOTS) await page.screenshot({path: path.join(SHOTS, 'pairup-checked.png')});
    await page.click('#v-pairup #pretry');
    const r1 = await ev(() => ({tray: [...document.querySelectorAll('#v-pairup #ptray .pchip')].map(c => c.dataset.pc), placed: Object.keys(FX.api('pair-up-drills').pair().placed).length}));
    check(r1.tray.length === 2 && r1.tray.includes(round[5][0]) && r1.tray.includes(round[6][0]) && r1.placed === 5, 'Retry the wrong ones returns only the wrong chips to the tray', r1);
    await page.click('#v-pairup [data-pset="ip-dumb"]');
    check(await ev(() => document.querySelectorAll('#v-pairup #ptray .pchip').length === 9), 'the 9-pair set (each letter of DUMBBELSS) is served whole');
    await page.click('#v-pairup [data-pset="ip-gprot"]');
    const bins = await ev(() => { const R = FX.api('pair-up-drills').pair().round, by = {}; R.forEach(p => { (by[p[1]] = by[p[1]] || []).push(p[0]); });
      const box = Object.keys(by).find(k => by[k].length >= 2); return {box, chips: by[box], n: R.length, boxes: document.querySelectorAll('#v-pairup .ptarget').length}; });
    await page.click(chipSel(bins.chips[0])); await page.click(boxAt(bins.box)); await page.click(chipSel(bins.chips[1])); await page.click(boxAt(bins.box));
    const b2 = await ev(([a, b]) => { const P = FX.api('pair-up-drills').pair().placed; return [P[a], P[b]]; }, bins.chips);
    check(bins.n === 12 && bins.boxes < 12 && b2[0] === bins.box && b2[1] === bins.box, `with several chips per box, two chips share the box "${bins.box}"`, {bins, b2});

    console.log('  -- the drug-receptor table --');
    await page.click('#nav button[data-v="rt-ip-rx"]');
    const cur = () => ev(() => { const T = FX.api('pair-up-drills').state('ip-rx'), it = T.queue[T.i]; return {ans: it.ans, n: T.queue.length, i: T.i, opts: T.opts}; });
    const optSel = t => ev(a => [...document.querySelectorAll('#v-rt-ip-rx [data-ptans]')].findIndex(b => b.textContent === a), t);
    let x = await cur();
    const shown = await ev(() => ({opts: document.querySelectorAll('#v-rt-ip-rx [data-ptans]').length, prompt: document.querySelector('#v-rt-ip-rx .rxq').textContent}));
    check(x.n === 39 && shown.opts === 5 && x.opts.includes(x.ans) && /Pick one/.test(shown.prompt), 'Name the receptor: every drug of the table in the round, five answers with the table\'s line among them', {n: x.n, shown});
    await settle(); await page.click(`#v-rt-ip-rx [data-ptans="${await optSel(x.ans)}"]`);
    const right = await ev(() => ({ok: document.querySelectorAll('#v-rt-ip-rx .rxopt.ok').length, fb: !!document.querySelector('#v-rt-ip-rx .pfbr.ok'), dis: document.querySelectorAll('#v-rt-ip-rx .rxopt:disabled').length}));
    check(right.ok === 1 && right.fb && right.dis === 5, 'a right tap is marked, the row shown, the answers closed', right);
    await page.click('#v-rt-ip-rx [data-ptnext]');
    x = await cur();
    await settle(); await page.click(`#v-rt-ip-rx [data-ptans="${x.opts.findIndex(o => o !== x.ans)}"]`);
    const wrong = await ev(() => ({bad: document.querySelectorAll('#v-rt-ip-rx .rxopt.bad').length, ok: document.querySelectorAll('#v-rt-ip-rx .rxopt.ok').length,
      said: /You said/.test(document.querySelector('#v-rt-ip-rx .pfbr').textContent), meta: document.querySelector('#v-rt-ip-rx .rxcard .meta').textContent}));
    check(wrong.bad === 1 && wrong.ok === 1 && wrong.said && /1 to redo/.test(wrong.meta), 'a wrong tap is marked with the right one, "You said", and 1 to redo', wrong);
    await page.keyboard.press('Enter');   // the Next button has the focus; Enter goes on either way
    for(;;){ x = await cur(); await settle(); await page.click(`#v-rt-ip-rx [data-ptans="${x.opts.indexOf(x.ans)}"]`); if(x.i + 1 >= x.n) break; await page.click('#v-rt-ip-rx [data-ptnext]'); }
    const endLabel = await ev(() => document.querySelector('#v-rt-ip-rx [data-ptnext]').textContent);
    await page.click('#v-rt-ip-rx [data-ptnext]');
    const redo = await ev(() => { const T = FX.api('pair-up-drills').state('ip-rx'); return {round: T.round, n: T.queue.length, best: DB.pairup.best['ip-rx:rec'], miss: DB.pairup.miss['ip-rx:rec'], id: T.queue[0].id}; });
    check(/Redo the 1 missed/.test(endLabel) && redo.round === 2 && redo.n === 1 && redo.best === '38/39' && redo.miss.length === 1 && redo.miss[0] === redo.id,
          'the round ends with "Redo the 1 missed"; the redo round holds the one miss; the best score and the miss are kept', {endLabel, redo});
    await page.click('#v-rt-ip-rx [data-ptmode="drug"]');
    x = await cur();
    check(x.opts.length === 4 && x.opts.includes(x.ans) && await ev(() => document.querySelectorAll('#v-rt-ip-rx [data-ptans]').length) === 4, 'Name the drug: four drugs, the right one among them', x.opts);
    await page.waitForTimeout(400);   // the core's save() writes 150 ms after the last change
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const kept = await ev(() => ({p: DB.pairup.best['pair:ip-rec'], r: DB.pairup.best['ip-rx:rec'], m: (DB.pairup.miss['ip-rx:rec'] || []).length}));
    check(kept.p === '5/7' && kept.r === '38/39' && kept.m === 1, 'the scores and the miss are kept through a reload', kept);
    await page.click('#nav button[data-v="rt-ip-rx"]');
    const first = await ev(() => { const T = FX.api('pair-up-drills').state('ip-rx'); return {id: T.queue[0].id, n: T.queue.length, best: document.querySelector('#v-rt-ip-rx .rxcard .meta').textContent}; });
    check(first.n === 39 && /best 38\/39/.test(first.best), 'after the reload the round has every drug and shows the best score', first);
    check(first.id === redo.id, 'the drug missed last time leads the next round', first.id);

    console.log('  -- the poisoning table --');
    await page.click('#nav button[data-v="rt-ip-pt"]');
    const pt = await ev(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {mode: T.mode, n: T.queue.length, opts: document.querySelectorAll('#v-rt-ip-pt [data-ptans]').length,
      modes: document.querySelectorAll('#v-rt-ip-pt [data-ptmode]').length, ans: T.queue[T.i].ans, all: T.opts}; });
    check(pt.mode === 'anti' && pt.n === 12 && pt.opts === 5 && pt.modes === 5, 'Name the antidote: its 12 rows, five answers; four modes and Cover and reveal offered', pt);
    await settle(); await page.click(`#v-rt-ip-pt [data-ptans="${pt.all.indexOf(pt.ans)}"]`);
    await page.click('#v-rt-ip-pt h2');   // focus away from the button, so the page-wide Enter is the one that goes on
    await page.keyboard.press('Enter');
    check(await ev(() => FX.api('pair-up-drills').state('ip-pt').i === 1), 'Enter goes on to the next row');
    // a double tap on Next: its second tap lands on the new card (Skip sits where Next was) and is not taken
    { await settle();
      const T0 = await ev(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {i: T.i, ans: T.queue[T.i].ans, opts: T.opts}; });
      await page.click(`#v-rt-ip-pt [data-ptans="${T0.opts.indexOf(T0.ans)}"]`);
      const dbl = await ev(() => { document.querySelector('#v-rt-ip-pt [data-ptnext]').click(); document.querySelector('#v-rt-ip-pt [data-ptskip]').click();
        document.querySelector('#v-rt-ip-pt [data-ptans]').click(); const T = FX.api('pair-up-drills').state('ip-pt'); return {i: T.i, redo: T.redo.length, result: !!T.result}; });
      check(dbl.i === T0.i + 1 && dbl.redo === 0 && !dbl.result, 'a tap on Skip or on an answer within 350 ms of Next is not taken', dbl);
      await settle(); await page.click('#v-rt-ip-pt [data-ptskip]');
      const sk = await ev(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {i: T.i, redo: T.redo.length}; });
      check(sk.i === T0.i + 2 && sk.redo === 1, 'Skip after that goes on and puts the row in the redo list', sk); }
    await page.click('#v-rt-ip-pt [data-ptmode="#cover"]');
    const want = IP.tables[1].rows.reduce((n, r) => n + ['sym', 'antidotes', 'moa', 'special'].filter(k => r[k]).length, 0);
    const cv = await ev(() => document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length);
    check(cv === want, `Cover and reveal: every covered cell is a Show button (${want})`, cv);
    await page.click('#v-rt-ip-pt [data-ptshow]');
    const one = await ev(() => ({n: document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length, text: document.querySelectorAll('#v-rt-ip-pt .pucard')[2].textContent}));
    check(one.n === want - 1 && one.text.includes(IP.tables[1].rows[0].sym), 'Show reveals that cell', one.n);
    await page.click('#v-rt-ip-pt [data-ptshowall]');
    check(await ev(() => document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length) === 0, 'Show all reveals every cell');
    await page.click('#v-rt-ip-pt [data-pthide]');
    check(await ev(() => document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length) === want, 'Hide again covers them again');
    await page.click('#v-rt-ip-pt [data-ptcover="sym"]');
    check(await ev(() => document.querySelectorAll('#v-rt-ip-pt [data-ptshow]').length) === 12, 'Cover symptoms covers the 12 symptom cells only');
    if(SHOTS) await page.screenshot({path: path.join(SHOTS, 'cover-symptoms.png')});
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    check(await ev(() => !FX.errors.length), 'no module error', await ev(() => JSON.stringify(FX.errors)));
    await ctx.close();

    console.log('  -- persistence: a large saved state --');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pairup-test-'));
    const P2 = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}, acceptDownloads: true}, DENY);
    const pg = P2.page, ev2 = (f, a) => pg.evaluate(f, a), wait = ms => pg.waitForTimeout(ms);
    const ready = () => pg.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const chip2 = n => `#v-pairup .pchip[data-pc="${n.replace(/"/g, '\\"')}"]`, box2 = n => `#v-pairup .ptarget[data-pt="${n.replace(/"/g, '\\"')}"] .pl`;
    // one whole round of a set through the page: every chip tapped, then its own box, then Check
    const placeRound = async set => {
      await pg.click('#nav button[data-v="pairup"]'); await pg.click(`#v-pairup [data-pset="${set}"]`);
      const R = await ev2(() => FX.api('pair-up-drills').pair().round.map(p => [p[0], p[1]]));
      for(const [c, b] of R){ await pg.click(chip2(c)); await pg.click(box2(b)); }
      return R.length; };
    const roundOf = async set => { const n = await placeRound(set); await pg.click('#v-pairup #pcheck'); return n; };
    // every mode's misses (every item but its first) and a best score per mode and per set, from the course's own items
    const big = await ev2(() => {
      const A = FX.api('pair-up-drills'), P = {best: {}, miss: {}};
      RECALL_TABLES.forEach(t => t.modes.forEach(m => { const it = A.items(t, m); P.miss[t.id + ':' + m.id] = it.slice(1).map(x => x.id); P.best[t.id + ':' + m.id] = `${Math.floor(it.length / 2)}/${it.length}`; }));
      PAIR_SETS.forEach(x => { P.best['pair:' + x.id] = '0/' + Math.min(x.pairs.length, x.bins ? 12 : x.pairs.length <= 9 ? x.pairs.length : 7); });
      DB.pairup = P; save();
      return {profile: PROFILE, best: Object.keys(P.best).length, miss: Object.values(P.miss).reduce((n, v) => n + v.length, 0)};
    });
    await wait(400);
    const snap = await ev2(() => JSON.stringify(DB.pairup)), SN = JSON.parse(snap);
    await pg.reload(); await ready();
    check(await ev2(() => JSON.stringify(DB.pairup)) === snap, `${big.best} best scores and ${big.miss} missed items come back after a reload`, big);
    await pg.click('#nav button[data-v="rt-ip-rx"]');
    const lead = await ev2(() => { const T = FX.api('pair-up-drills').state('ip-rx'), m = DB.pairup.miss['ip-rx:rec'];
      return {n: T.queue.length, m: m.length, first: T.queue.slice(0, m.length).every(x => m.includes(x.id)), meta: document.querySelector('#v-rt-ip-rx .rxcard .meta').textContent}; });
    check(lead.n === 39 && lead.m === 38 && lead.first && /best 19\/39/.test(lead.meta), 'the 38 saved misses lead the round of 39, and the saved best score is shown', lead);

    // Export, then Import into a new profile
    await ev2(() => show('settings'));
    const dl = pg.waitForEvent('download'); await pg.click('#btnExport');
    const ef = path.join(tmp, 'export.json'); await (await dl).saveAs(ef);
    const exported = JSON.parse(fs.readFileSync(ef, 'utf8'));
    check(JSON.stringify(exported.db.pairup) === snap, `Export progress carries every best score (${Object.keys((exported.db.pairup || {}).best || {}).length}) and every miss list (${Object.keys((exported.db.pairup || {}).miss || {}).length})`);
    await ev2(() => { window.__name = 'Fresh'; askProfile(true); show('settings'); });
    check(await ev2(() => PROFILE === 'Fresh' && !DB.pairup), 'a new profile starts with no Pair up or table progress');
    await pg.setInputFiles('#fileIn', ef); await wait(600);
    check(await ev2(() => JSON.stringify(DB.pairup)) === snap, 'Import progress into the new profile brings back the same best scores and misses');
    await pg.reload(); await ready();
    check(await ev2(() => PROFILE === 'Fresh' && JSON.stringify(DB.pairup)) === snap, 'the imported progress is saved: it comes back after a reload');

    // each profile keeps its own
    await ev2(() => { window.__name = 'Other'; askProfile(true); });
    check(await ev2(() => PROFILE === 'Other' && !DB.pairup), 'a third profile has no Pair up or table progress');
    const nAnti = await roundOf('ip-anti'); await wait(400);
    const other = await ev2(() => JSON.stringify(DB.pairup));
    check(other === JSON.stringify({best: {'pair:ip-anti': nAnti + '/' + nAnti}, miss: {}}), 'a whole round in the third profile keeps only its own score there', other);
    await ev2(() => { window.__name = 'Fresh'; askProfile(true); });
    check(await ev2(() => JSON.stringify(DB.pairup)) === snap, 'switching back, the profile has its own best scores and misses, unchanged');
    await ev2(() => { window.__name = 'Other'; askProfile(true); });
    check(await ev2(() => JSON.stringify(DB.pairup)) === other, 'the third profile still has only its own score');
    await ev2(() => { window.__name = 'Fresh'; askProfile(true); });
    check(await ev2(() => PROFILE === 'Fresh'), 'back on the profile with the large saved state');

    // a reload soon after Check (the core writes the progress 150 ms after the last change)
    const reset = async () => { await ev2(() => { DB.pairup.best['pair:ip-anti'] = '0/8'; DB.pairup.best['pair:ip-dumb'] = '0/9'; save(); }); await wait(400); };
    await roundOf('ip-anti'); await wait(400);
    await pg.reload(); await ready();
    check(await ev2(() => DB.pairup.best['pair:ip-anti']) === '8/8', 'a reload 400 ms after Check keeps the new best score');
    await reset();
    await placeRound('ip-anti');
    await Promise.all([pg.waitForNavigation(), ev2(() => { document.querySelector('#v-pairup #pcheck').click(); location.reload(); }).catch(() => {})]);
    await ready();
    const fast = await ev2(() => ({b: DB.pairup.best['pair:ip-anti'], best: Object.keys(DB.pairup.best).length, miss: JSON.stringify(DB.pairup.miss)}));
    console.log(`  report  a reload in the same moment as Check: the best score reads ${fast.b} (${fast.b === '8/8' ? 'the new score was kept' : 'the new score was lost; the score saved before is kept'})`);
    check((fast.b === '8/8' || fast.b === '0/8') && fast.best === big.best && fast.miss === JSON.stringify(SN.miss),
          'a reload at once after Check loses at most that score, and every other saved value is still there', {b: fast.b, best: fast.best});

    // storage denied, then storage full
    for(const mode of ['denied', 'full']){
      await pg.reload(); await ready(); await reset();
      const stored0 = await ev2(() => localStorage.getItem(keyFor(PROFILE)));
      await ev2(m => { window.__deny = m; }, mode);
      await roundOf('ip-anti'); await wait(400);
      const r = await ev2(() => ({warn: (() => { const w = document.querySelector('#savewarn'); if(!w) return false; const b = w.getBoundingClientRect(), cs = getComputedStyle(w);
          return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; })(),
        text: (document.querySelector('#savewarn') || {}).textContent || '', stored: localStorage.getItem(keyFor(PROFILE)), mem: DB.pairup.best['pair:ip-anti'],
        shown: document.querySelector('#v-pairup #pscore').textContent}));
      check(r.warn && /did not save your progress/.test(r.text), `storage ${mode}: the student is told the progress was not saved`, r.text);
      check(r.stored === stored0 && r.mem === '8/8' && /8 of 8 right/.test(r.shown), `storage ${mode}: the stored progress is left as it was, and the new score stays on screen`, {mem: r.mem, shown: r.shown, same: r.stored === stored0});
      if(SHOTS && mode === 'full') await pg.screenshot({path: path.join(SHOTS, 'storage-full.png')});
      await ev2(() => { window.__deny = null; });
      await roundOf('ip-dumb'); await wait(400);
      await pg.reload(); await ready();
      const back = await ev2(() => ({a: DB.pairup.best['pair:ip-anti'], d: DB.pairup.best['pair:ip-dumb'], best: Object.keys(DB.pairup.best).length, miss: JSON.stringify(DB.pairup.miss)}));
      check(back.a === '8/8' && back.d === '9/9' && back.best === big.best && back.miss === JSON.stringify(SN.miss),
            `storage ${mode}: once storage works, the next change is saved with the score kept on screen and every earlier value, and loads after a reload`, {a: back.a, d: back.d, best: back.best});
    }

    // a saved value in another shape (an older or edited export) is read as none
    await ev2(() => { const k = keyFor(PROFILE), d = JSON.parse(localStorage.getItem(k));
      d.pairup.best['ip-rx:rec'] = 7; d.pairup.miss['ip-rx:rec'] = 5; d.pairup.miss['ip-pt:anti'] = {a: 1}; localStorage.setItem(k, JSON.stringify(d)); });
    await pg.reload(); await ready();
    // a module that stops on a saved value drops its tabs: a tab is opened only when it is there
    const openTab = v => ev2(v => { const b = document.querySelector(`#nav button[data-v="${v}"]`); if(b) b.click(); return !!b; }, v);
    const tabs = [await openTab('rt-ip-rx')];
    const qlen = id => ev2(id => { const A = FX.api('pair-up-drills'), T = A && A.state(id); return T ? T.queue.length : -1; }, id);   // -1: the module is not working
    const bs = {n: await qlen('ip-rx'), meta: await ev2(() => (document.querySelector('#v-rt-ip-rx .rxcard .meta') || {}).textContent || '')};
    tabs.push(await openTab('rt-ip-pt'));
    const bs2 = await qlen('ip-pt');
    check(tabs.every(Boolean) && bs.n === 39 && !/best/.test(bs.meta) && bs2 === 12 && !P2.errors.length && await ev2(() => !FX.errors.length),
          'a saved best score or miss list in another shape is read as none: both tables open with every row', {tabs, bs, bs2, errors: P2.errors.slice(0, 2)});
    // a redo round leaves the best score as it was (the best is the first round's, as in Intro to Pharmacology)
    if(bs2 !== 12) check(false, 'the redo-round check below needs the poisoning table to open', bs2);
    else {
    await pg.click('#v-rt-ip-pt [data-ptmode="special"]');
    const sp = async right => { await wait(370);
      const x = await ev2(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {ans: T.queue[T.i].ans, opts: T.opts}; });
      await pg.click(`#v-rt-ip-pt [data-ptans="${right ? x.opts.indexOf(x.ans) : x.opts.findIndex(o => o !== x.ans)}"]`); await pg.click('#v-rt-ip-pt [data-ptnext]'); };
    const ptNow = () => ev2(() => { const T = FX.api('pair-up-drills').state('ip-pt'); return {best: DB.pairup.best['ip-pt:special'], miss: (DB.pairup.miss['ip-pt:special'] || []).length, round: T.round, n: T.queue.length}; });
    const n6 = (await ptNow()).n;
    for(let k = 0; k < n6; k++) await sp(k > 0);
    const sr1 = await ptNow();
    await sp(true);
    const sr2 = await ptNow();
    check(n6 === 6 && sr1.best === '5/6' && sr1.miss === 1 && sr1.round === 2 && sr1.n === 1 && sr2.best === '5/6' && sr2.miss === 0 && sr2.round === 1 && sr2.n === 6,
          'the 6 special questions with one miss: the best becomes 5/6 and the miss is kept; the redo round answered right leaves 5/6 and clears the miss', {n6, sr1, sr2});
    }
    check(!P2.errors.length, 'no page error in the persistence runs', P2.errors.slice(0, 3).join(' | '));
    await P2.ctx.close();
    fs.rmSync(tmp, {recursive: true, force: true});

    console.log('  -- the module options, set by the course --');
    const so = L.scratchBuild('pairup-opts', {files: fixtureFiles(own), courseLine: courseLine + L.featureOn(__dirname, {pairLabel: 'Match up', wholeUpTo: 8, pairRound: 5, binRound: 10})});
    if(!check(so.code === 0, 'a copy with pairLabel, wholeUpTo, pairRound and binRound set builds', so.out.split('\n').slice(-2).join(' '))) { so.rm(); L.finish(NAME); }
    try {
      const P3 = await L.openPage(browser, so.page, {viewport: {width: 1100, height: 1300}});
      const sizes = await P3.page.evaluate(() => { const A = FX.api('pair-up-drills'), out = {};
        for(const id of ['ip-rec', 'ip-dumb', 'ip-anti', 'ip-gprot']){ A.pair().set = id; A.pair().round = []; A.vPair(); out[id] = A.pair().round.length; }
        out.label = (document.querySelector('#nav button[data-v="pairup"]') || {}).textContent || ''; return out; });
      check(sizes.label.trim() === 'Match up' && sizes['ip-rec'] === 5 && sizes['ip-dumb'] === 5 && sizes['ip-anti'] === 8 && sizes['ip-gprot'] === 10,
            'the options are used: the tab is "Match up"; a 14-pair and a 9-pair set give 5 a round, the 8-pair set is whole, the 12-chip set with shared boxes gives 10', sizes);
      check(!P3.errors.length, 'no page error with the options set', P3.errors.slice(0, 3).join(' | '));
      await P3.ctx.close();
    } finally { so.rm(); }
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
