/* glossary-tap: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data: every term in TERMS is found by its own name, as
 * that term, by the finder the tap uses (a name with brackets, a slash, a Greek
 * letter or a dash is escaped, and the longest name wins); the number of terms
 * the bank's explanations name is printed.
 * The build step: no TERMS, an empty TERMS, an id used twice, a term with no
 * definition, a figure that is not in DIA, a lecture that is not in
 * COURSE.lectures, two terms found by the same name and a notTapped id that is
 * not a term each stop the step with that reason; a duplicate name stops the
 * whole build with no page written.
 * On a scratch copy with 8 of Intro to Pharmacology's terms (exam1-drill/src/
 * glossary.js), 2 of its questions (q_L02.js L02-018 and L02-023) and 2 of its
 * guide sections (guide.js sections 1 and 4, first lines), at 929cd62 (ids
 * prefixed gtp-, the professor, topic and skill set to the course's own, the
 * figure keys replaced by one of the course's own DIA figures), with the core's
 * GLOSS given a bracketed definition of "affinity" (the term's own gist), in
 * Chromium (Intro to Pharmacology browser_test.js lines 53-56 ported: the
 * glossary shows its terms and figures; the rest written for the kit): the tab
 * in the nav before Settings; every term with its definition and source, under
 * its group; a search lists names that match first, then terms that only
 * mention the word, with the count; Clear; a letter switches to A-Z and jumps
 * to the letter, absent letters disabled; a group chip narrows the list; the
 * floating button once the search bar is off screen. Tap a term: nothing marked
 * before the answer is shown; after it, each term once per question, never in
 * an option's own text or the stem; a tap opens the definition under the line
 * and a second tap closes it; "Open in the Glossary" opens the tab at the term,
 * with the way back; a term the core glossed in brackets in that question is
 * not a button there; in the Guides tab each term once per section, again in
 * the next section, and not in a section whose word list (dt) defines it; not
 * inside a link (guide4.js section 23), not in the source line, not inside a
 * quotation in quotation marks (T-affinity-3), but a quotation of a term's name
 * alone is (L10-030); the exam review marks terms per question card the same way.
 * The module stores nothing: the page's saved keys are unchanged after the
 * glossary and taps are used, and with storage blocked or full (setItem throws)
 * the tab and the taps work. With notTapped the term is no longer found; with
 * tap off nothing is marked.
 * With formulas-in-text, when the course has it in src/features/ (otherwise
 * skipped): 7 Basic-Pharmacokinetics terms and its question ws6-i3-2c (ac2eb73),
 * built three ways (formulas-in-text alone; formulas-in-text then glossary-tap;
 * glossary-tap then formulas-in-text). In the quiz card and the exam review the
 * fractions stack and the subscripts are set, every term named is a button once,
 * and with the buttons put back to text each explanation is exactly what
 * formulas-in-text alone draws; in the Guides tab a term inside a fraction's
 * numerator is a button, a tap opens it, and a <q> quotation is not marked.
 *
 *     node features/glossary-tap/test.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/glossary-tap/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;
const HERE = __dirname;

/* 10 terms, 4 questions and 2 guide sections from Intro to Pharmacology
   (exam1-drill/src/glossary.js, q_L02.js L02-018 and L02-023, q_L10.js L10-030,
   q_TERMS.js T-affinity-3, guide.js, at 929cd62): the terms' lecture and fig and
   the questions' prof, lecture, level, ladder, fg, dupOf and reading fields left out.
   Receptor and Receptor tyrosine kinase (rtk) share their first word, so the
   finder must try the longer name first. L10-030 names the cheese effect only in quotation marks; T-affinity-3 quotes a
   poll sentence that holds "receptor". ci/oncourse.js copies `terms` from this line. */
const FIX = {"terms":[{"id":"pharmacodynamics","term":"Pharmacodynamics (PD)","group":"Drug basics","def":"The study of the biochemical and physiological effects of drugs and their mechanisms of action. General rules: the drug must reach the site of action, must bind to and interact with a receptor, and does not create anything but changes the ongoing physiological system.","hook":"Spoken definition: “the study of how drugs interact with the biological system.” Its two basic concepts are affinity and efficacy.","gist":"How the drug interacts with the biological system: affinity and efficacy only.","scene":"Metoprolol reaches the heart, binds the β1 receptor and blocks it, and the heart rate falls; nothing new is created, an ongoing process is changed.","confuse":["pharmacokinetics","pharmacology"],"quote":"General rules: 1) Drug must reach the site of action 2) Drug must bind to and interact with a receptor 3) Drug do not create anything, but change the ongoing phys. system","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~31; Pharmacodynamics-Day-1-2026s.pdf slide ~22; transcript 9/23","src":"both"},{"id":"drug","term":"Drug","group":"Drug basics","def":"A chemical substance that alters an ongoing physiological or pathological function by interacting with components of a biological system. Drugs initiate, inhibit or modulate a response; they do not create anything new.","hook":"Walter Straub: there is only a quantitative difference between a drug and a poison (vitamin A in carrots vs polar bear liver).","gist":"A chemical that changes an ongoing function; enhances or suppresses, creates nothing new.","scene":"Metoprolol does not create a new heartbeat; it slows the rate the heart was already producing. Vitamin A in a carrot helps night blindness and in a polar bear liver poisons: only the amount differs.","confuse":["ligand","nds"],"quote":"drugs don’t create anything new, they just change whatever is happening in the body. Either they are going to enhance the signal or perhaps suppress the signal","cite":"Pharmacodynamics-Day-1-2026s.pdf slides ~29–~31; transcript 9/22","src":"both"},{"id":"receptor","term":"Receptor","group":"Drug basics","def":"Regulatory proteins involved in the transfer of chemical information carried by endogenous or exogenous mediators. Classified by the structure of the receptor protein and its transduction components: ion channels, 7-transmembrane (GPCR), 1-transmembrane (tyrosine kinases) and intracellular/nuclear receptors.","hook":"His picture: the gatekeeper that senses hormones, neurotransmitters and drugs; the message the receptor creates is the physiological response. Receptors come in two flavors, active or inactive.","gist":"The regulatory protein that senses hormones, neurotransmitters and drugs; it is active or inactive.","scene":"A protein in the heart cell membrane recognizes norepinephrine by its shape and size, changes its conformation, and the cell answers with a faster beat. The same protein also binds metoprolol.","confuse":["ligand","effector","transducer"],"quote":"Receptors are regulatory proteins involved in the transfer of chemical information carried by various endogenous/exogenous mediators","cite":"Pharmacodynamics-Day-1-2026s.pdf slides ~11, ~34–~36; transcript 9/22","src":"both"},{"id":"affinity","term":"Affinity","group":"Drug–receptor binding","def":"The attraction of a ligand for the receptor: how likely a drug is to bind and stay bound. It depends on the molecular forces (bonds) the drug forms with the receptor and is measured by Kd: the smaller the Kd, the greater the affinity.","hook":"Affinity is read on the x-axis (further left = higher affinity); efficacy on the y-axis. Poll trap: “the ability of a drug to bind and stay bound to a receptor” is affinity, not efficacy.","gist":"How likely a drug binds and stays bound; depends on the bonds formed.","scene":"Phenoxybenzamine forms a covalent bond with the α1 receptor and stays bound; prazosin forms weaker bonds and comes off. On a binding curve, the drug furthest left binds 50% of receptors at the smallest dose.","confuse":["efficacy","potency","kd"],"quote":"Remember, affinity is how likely a drug is to bind and stay bound to a receptor, and the binding of a drug to the receptor is going to be depending on what type of bonds they form covalent bonds, hydrogen bonds, ion bonds.","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~31, ~55; Pharmacodynamics-Day-1-2026s.pdf slides ~21, ~37; transcript 9/22; transcript 9/23","src":"both"},{"id":"efficacy","term":"Efficacy (intrinsic efficacy)","group":"Drug–receptor binding","def":"The property of a molecule that causes the receptor to change its behavior: the ability of the drug to change the receptor state, active to inactive or inactive to active. Positive efficacy activates receptors, negative efficacy shuts them down, and zero efficacy is a neutral antagonist.","hook":"Read on the y-axis as the height of the curve (Emax). Efficacy cannot be calculated directly; it is a relative measurement between ligands.","gist":"The ability to change the receptor state; positive activates, negative shuts down.","scene":"Norepinephrine binds β1 and flips it from inactive to active, loratadine binds H1 and flips it from active to inactive, and metoprolol binds β1 without changing its state.","confuse":["affinity","intrinsic-activity","potency"],"quote":"Efficacy is the ability of that drug to change the receptor behavior. It’s activity, its state from active to inactive or inactive to active, right?","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~31; Pharmacodynamics-Day_3_2026s.pdf slides ~19, ~26; Pharmacodynamics-Day-1-2026s.pdf slide ~38; transcript 9/22; transcript 9/23","src":"both"},{"id":"kd","term":"Kd (dissociation constant)","group":"Drug–receptor binding","def":"The drug concentration that binds 50% of the available binding sites (also written Ki, Ka). From the law of mass action it equals K2/K1, the rate of dissociation over the rate of association. The smaller it is, the greater the affinity: inversely proportional.","hook":"Read on the x-axis of a binding curve; it says nothing about effect. Convert units before comparing (milli 10^-3, micro 10^-6, nano 10^-9): “the units ... about 10% of you are gonna miss it.”","gist":"The concentration binding 50% of receptors; smaller means greater affinity, says nothing of effect.","scene":"For the β1 receptor drug A has a value of 30 micromolar and drug B 100 nanomolar; after converting the units the smaller number means drug B binds half of the receptors at a lower concentration (at M1 both are 250 nanomolar: equal affinity). Convert milli, micro and nano before comparing.","confuse":["ec50","affinity","mass-action"],"quote":"So the take-home message is that the smaller the coefficient of dissociation is, the more drugs receptors are going to find together, and thus the greater the affinity is going to be.","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~45–~50; Pharmacodynamics-Day_3_2026s.pdf slide ~31; transcript 9/24","src":"both"},{"id":"orthosteric","term":"Orthosteric site","group":"Drug–receptor binding","def":"The receptor’s own binding pocket, where the endogenous agonist binds. Drugs that bind there (phenylephrine, prazosin, phenoxybenzamine at α1) compete for that one pocket, so only one can be bound at a time: either one or the other, not both.","hook":"Orthosteric: one or the other. Allosteric: one and the other. Spoken as “orthostatic” in the transcripts; the slide term is orthosteric.","gist":"The receptor’s own pocket where the endogenous agonist binds; one or the other.","scene":"Phenylephrine, prazosin and phenoxybenzamine all go for the same pocket on the α1 receptor, the one norepinephrine uses, so only one of them can be in it at a time.","confuse":["allosteric"],"quote":"How we define orthostatic. So they compete for the same binding pocket, right? ... with orthostatic, we can have either one or the other, not both at the same time. As with allosteric, we can have one in the other","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~18–~19; transcript 9/23; transcript 9/24","src":"both"},{"id":"mass-action","term":"Law of mass action","group":"Drug–receptor binding","def":"The rate of a chemical reaction is proportional to the concentration (mass) of the reactants: the more drug or the more receptors present, the greater the chance of binding. It is the basis of Kd and of dose responsiveness.","hook":"More receptors in a tissue make the same dose of norepinephrine appear more potent (curve shifts left) while its Kd, affinity and efficacy are unchanged; what changed is the tissue.","gist":"More drug or more receptors present, greater the chance of binding.","scene":"Two hearts get the same dose of norepinephrine, one with 10 receptors and one with 100; the heart with 100 responds at a lower dose, though norepinephrine itself is unchanged.","confuse":["kd"],"quote":"The more I have either of the receptors or the more I have either the drug, the greater the capacity of binding to something is going to be, right?","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~45; transcript 9/24","src":"both"},{"id":"cheese-effect","term":"Cheese effect (tyramine)","group":"Adrenergic drugs","def":"The hypertensive crisis that follows eating tyramine-rich fermented foods (cheese, bread, wine) while taking a non-selective MAO-A and MAO-B inhibitor such as phenelzine: the gut enzyme can no longer break down dietary tyramine. Selective MAO-B inhibitors (selegiline at low doses) do not cause it.","gist":"Fermented food plus a non-selective enzyme blocker: a blood pressure crisis.","scene":"A man taking phenelzine forgets his diet at a party, eats aged fermented food with wine, and his blood pressure soars until he passes out and an ambulance is called.","confuse":["mao-a","rebound-hypertension"],"quote":"And the reason being is because you have the inability to break down that dietary tyramine that you're consuming, and those fermented foods have high levels of tyramine, and that can cause what is called a hypertensive crisis.","cite":"PCOL-Adrenergic_PCOL-26s_PTII_pptx.pdf slide 15; transcript 10/6","src":"both"},{"id":"rtk","term":"Receptor tyrosine kinase (RTK, 1-TM)","group":"Receptors and signaling","def":"A 1-transmembrane receptor linked to an intracellular enzyme: an extracellular binding domain outside and intrinsic enzymatic (catalytic) activity inside. Ligand binding to the inactive monomer induces dimerization, cross-phosphorylation of the kinase domains and docking sites for signaling complexes; a tyrosine phosphatase resets it. Receptors for insulin and growth factors (cell survival, proliferation, differentiation).","hook":"Downstream: Grb2 → GEF → RAS → RAF → MEK → ERK → gene transcription; 20–25% of cancers contain a RAS mutation, so a RAS blocker is an indirect antagonist that stops cell growth.","gist":"Crosses the membrane once; binding outside, enzyme activity inside; insulin, growth factors.","scene":"Insulin binds the outer part of a protein that crosses the membrane once; two of them pair up, phosphorylate each other inside the cell, and the cascade runs through RAS, RAF, MEK and ERK to gene transcription.","confuse":["gpcr","nuclear-receptor","ion-channel"],"quote":"They have this binding pocket on the outside, and they have this enzymatic activity inside of the cell. Typically those are transcription factors like insulin growth factors.","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~4–~11; Pharmacodynamics-Day-1-2026s.pdf slides ~35–~36; transcript 9/23","src":"both"}],"qs":[{"id":"L02-018","tier":"new","topic":"L02","sub":"site","skill":"apply","concept":"diazepam-gaba-pam","tags":["exam-cue"],"source":"both","stem":"GABA (γ-aminobutyric acid) is bound to its GABA-A receptor, a chloride (Cl−) ion channel, when diazepam is added. What is the result?","options":[{"t":"GABA binds better; more Cl− enters","correct":true,"why":"Diazepam is a positive allosteric modulator: it increases the affinity and/or efficacy of GABA, so more chloride enters."},{"t":"GABA is displaced; less Cl− enters","correct":false,"why":"Diazepam does not compete for the GABA site; it binds someplace else."},{"t":"Cl− leaves the neuron","correct":false,"why":"Opening the GABA channel lets chloride move from outside to inside the cell."},{"t":"Na+ enters; the neuron is more excitable","correct":false,"why":"GABA is the major inhibitory pathway; the channel conducts chloride and shuts things down."}],"teach":"GABA binds its orthosteric sites and opens the GABA-A channel; chloride enters, the membrane becomes more negative, and the person becomes less anxious and more sleepy. Diazepam, an allosteric agonist (positive allosteric modulator, PAM), binds elsewhere and increases GABA's affinity and/or efficacy, so more chloride enters faster or longer.","quote":"Benzos increase the affinity And/or efficacy of GABA For its receptor","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~21–~24; transcript 9/23"},{"id":"L02-023","tier":"new","topic":"L02","sub":"class","skill":"tell","concept":"efficacy-definition","tags":["poll"],"source":"both","stem":"Which best describes efficacy?","options":[{"t":"Ability of a drug to bind and stay bound to a receptor","correct":false,"why":"Binding and staying bound is affinity."},{"t":"Ability of a cell to increase its number of receptors","correct":false,"why":"Receptor number is the cell's business, not a drug property."},{"t":"Ability of a drug to change the receptor behavior","correct":true,"why":"Efficacy is the drug changing the receptor state from inactive to active or active to inactive."},{"t":"Ability of a drug to be absorbed into the body","correct":false,"why":"Absorption is pharmacokinetics, not pharmacodynamics."}],"teach":"Affinity describes the association between drug and receptor (molecular forces, bonds). Efficacy (intrinsic efficacy) describes the mechanism by which the drug changes the receptor. A drug with efficacy changes the receptor state; one with zero efficacy (a neutral antagonist) does not.","quote":"Efficacy is the ability of that drug to change the receptor behavior. It's activity, its state from active to inactive or inactive to active, right?","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slide ~31; transcript 9/23"},{"id":"L10-030","tier":"new","topic":"L10","sub":"mao","skill":"apply","concept":"cheese-effect-crisis","tags":[],"source":"both","stem":"A patient taking phenelzine eats aged cheese and drinks wine at a party. Which is most likely?","options":[{"t":"Hypertensive crisis","correct":true,"why":"Non-selective MAO inhibition leaves dietary tyramine unprocessed: the “cheese effect”, a hypertensive crisis."},{"t":"Severe hypotension","correct":false,"why":"The tyramine reaction raises blood pressure."},{"t":"Bradycardia from vagal tone","correct":false,"why":"The reaction is sympathetic and hypertensive."},{"t":"No reaction","correct":false,"why":"Fermented foods are high in tyramine, which the patient cannot break down."},{"t":"Sedation","correct":false,"why":"The tyramine reaction is sympathetic: blood pressure climbs to a hypertensive crisis; it does not sedate."}],"teach":"A non-selective monoamine oxidase (MAO) inhibitor blocks MAO in the gut as well as the brain, so dietary tyramine from fermented foods (cheese, bread, wine) is not broken down. The result is a hypertensive crisis, the “cheese effect”. A patient on the drug who eats cheese can pass out from the very high pressure and need emergency care.","quote":"You cannot eat anything that is fermented. Like cheese and bread and wine, all of those are off the plate, right? And the reason being is because you have the inability to break down that dietary tyramine that you're consuming, and those fermented foods have high levels of tyramine, and that can cause what is called a hypertensive crisis.","cite":"PCOL-Adrenergic_PCOL-26s_PTII_pptx.pdf slide 15; transcript 10/6"},{"id":"T-affinity-3","tier":"new","topic":"TERMS","sub":"g2","skill":"term","concept":"term-affinity","tags":["term"],"source":"both","stem":"Which term is defined as: How likely a drug binds and stays bound; depends on the bonds formed?","options":[{"t":"Affinity","correct":true,"why":"This defines Affinity: How likely a drug binds and stays bound; depends on the bonds formed. Affinity is read on the x-axis (further left = higher affinity); efficacy on the y-axis. Poll trap: “the ability of a drug to bind and stay bound to a receptor” is affinity, not efficacy."},{"t":"Orthosteric site","correct":false,"why":"Orthosteric site: The receptor’s own pocket where the endogenous agonist binds; one or the other. The definition given is Affinity: How likely a drug binds and stays bound; depends on the bonds formed."},{"t":"Efficacy","correct":false,"why":"Efficacy (intrinsic efficacy): The ability to change the receptor state; positive activates, negative shuts down. The definition given is Affinity: How likely a drug binds and stays bound; depends on the bonds formed."},{"t":"Potency","correct":false,"why":"Potency (pharmacological): How much drug is needed; a combination of affinity, efficacy and the tissue. The definition given is Affinity: How likely a drug binds and stays bound; depends on the bonds formed."}],"teach":"How likely a drug binds and stays bound; depends on the bonds formed. Affinity is read on the x-axis (further left = higher affinity); efficacy on the y-axis. Poll trap: “the ability of a drug to bind and stay bound to a receptor” is affinity, not efficacy. Scene: Phenoxybenzamine forms a covalent bond with the α1 receptor and stays bound; prazosin forms weaker bonds and comes off. On a binding curve, the drug furthest left binds 50% of receptors at the smallest dose.","quote":"Remember, affinity is how likely a drug is to bind and stay bound to a receptor, and the binding of a drug to the receptor is going to be depending on what type of bonds they form covalent bonds, hydrogen bonds, ion bonds.","cite":"Pharmacodynamics-Day_2_2026s copy.pdf slides ~31, ~55; Pharmacodynamics-Day-1-2026s.pdf slides ~21, ~37; transcript 9/22; transcript 9/23"}],"guide":"<h3 id=\"guide-1\">1. Affinity, efficacy, potency</h3>\n<h4>What it is</h4>\n<ul>\n<li><b>Affinity</b>: how likely a drug is to bind and stay bound; set by the bonds it forms (covalent, ionic, hydrogen, van der Waals). <small>Day 2 ~55; (T) 9/23</small></li>\n<li><b>Efficacy</b>: the ability to change the receptor's state, inactive (R) or active (R*); positive (activates receptors) or negative (shuts them down). <small>Day 1 ~38; (T) 9/22, 9/23</small></li>\n<h3 id=\"guide-4\">4. Orthosteric vs allosteric</h3>\n<h4>What it is</h4>\n<ul>\n<li><b>Orthosteric</b> drugs bind the receptor's own pocket and compete for it: one or the other (phenylephrine, prazosin, phenoxybenzamine). <small>Day 2 ~18; (T) 9/23</small></li>\n<li><b>Allosteric</b> drugs bind a second site and change the pocket, so the agonist's affinity, efficacy, both or neither changes: one and the other. <small>Day 2 ~19–~20, ~39, ~44; (T) 9/23</small></li>"};
/* With formulas-in-text: 7 terms of Basic-Pharmacokinetics (src/glossary.js, module
   and lecture left out) and its question ws6-i3-2c (src/q9_worksheets.js line 168),
   at ac2eb73, with the prof, exam, module, lecture, topic, sub, skill, steps, givens
   and check fields left out; its concept block is {h, list} there and is given here
   as the kit's {h, t} sections, one per list item, wording unchanged. Its option
   explanations name terms beside ClT, Cp and a {{frac:}}; its concept block holds
   Cl = {{frac:rate of elimination|Cp}}. */
const FIXPK = {"terms":[{"id":"pharmacokinetics","term":"Pharmacokinetics","group":"Basics and models","def":"Pharmacokinetics is the study of ADME: absorption, distribution, metabolism and excretion.","gist":"Study of absorption, distribution, metabolism and excretion of a drug over time.","scene":"A course follows how a drug level in the body changes with time as the drug is taken up, spread to tissues, chemically converted and removed. It does not follow the response the drug produces.","hook":"She separates it from pharmacodynamics by the pair of variables: concentration and time here, concentration and response there.","confuse":["pharmacodynamics","biopharmaceutics","clinical-pharmacokinetics"],"quote":"pharmacodynamics, concentration. And Response. OK, pharmacokinetics, concentration and time.","cite":"Introduction.pdf, PDF page 4 (printed slide 4); PDF page 17 (printed slide 15); transcript 08-17","src":"both"},{"id":"elimination","term":"Elimination","group":"Elimination and clearance","def":"Elimination - irreversible loss of drug from the body by all routes. Drug elimination: irreversible removal of drug from the body by all routes of elimination.","gist":"Irreversible loss of drug by every route; covers metabolism and excretion.","scene":"One word covers both the liver converting a drug to a metabolite and the kidney passing it out intact, because both remove the drug from the body for good.","hook":"Her catch-all term: metabolism and excretion both fall under it.","confuse":["excretion","metabolism","disposition","clearance"],"quote":"Elimination refers to the irreversible loss of drugs from the body by all routes, right? So, Metabolism and excretion are both elimination terms, right? Elimination is kind of our catch-all.","cite":"Introduction.pdf, PDF page 5 (printed slide 5); 4---Clearance-and-Elimination.pdf, PDF page 3 (printed slide 3); transcript 08-17","src":"both"},{"id":"bioavailability","term":"Bioavailability (F)","group":"Absorption and oral dosing","def":"Bioavailability - measure of the systemic availability of a drug. {{frac:AUCoral|AUCIV}} = F, where F represents the fraction of oral dose that enters the plasma or the bioavailability factor. AUC is the area under the plasma concentration-time curve after the oral and after the IV dose.","gist":"Fraction of a dose that reaches systemic circulation; taken as 1 for IV doses.","scene":"The exposure measured after an oral dose is divided by the exposure after the same IV dose, giving the share of the oral dose that enters the plasma. For the IV dose that share is taken as 1.","hook":"For IV doses she takes capital F as 1, and a capital F in a stem should make you think oral.","confuse":["fraction-excreted","first-pass-effect","area-under-the-curve","absorption"],"quote":"when you see a capital F, You should think oral.","cite":"Introduction.pdf, PDF page 5 (printed slide 5); PDF page 27 (printed slide 23); transcript 09-14, 09-21","src":"both"},{"id":"plasma","term":"Plasma (Cp = concentration in plasma)","group":"Basics and models","def":"Liquid supernatant obtained after centrifugation of non-clotted whole blood that contains an anticoagulant; the noncellular liquid fraction of whole blood, containing all the proteins including albumin.","gist":"Liquid from spun, unclotted, anticoagulated blood; keeps all proteins including albumin.","scene":"A sample drawn into a tube with heparin is spun in a centrifuge without being allowed to clot. The liquid on top, which still holds albumin, is sent for the drug assay.","hook":"Serum or plasma is what is mostly measured, to keep the drug from interacting with other parts of the sample; a subscript p on C names this fluid.","confuse":["serum","whole-blood"],"quote":"if you see CP, we're looking at concentration of drug in the plasma, CS we're looking at concentration of drug in the serum, or if you just see a C, you can assume whatever.","cite":"Introduction.pdf, PDF page 11 (printed slide 10); PDF page 18 (no printed number); transcript 08-17, 08-19","src":"both"},{"id":"clearance","term":"Clearance (Cl)","group":"Elimination and clearance","def":"Clearance - measure of drug elimination from the body without identifying the mechanism or process; volume of plasma that is cleared of drug per unit time. ClT = kVD = {{frac:D0|AUC}}: total body clearance ClT is the elimination rate constant k times the volume of distribution VD. Equally, it is the dose D0 divided by the area under the concentration-time curve AUC.","gist":"Volume of fluid cleared of drug per unit time; constant for most drugs.","scene":"A drug's k is multiplied by its volume of distribution to give a figure in L/hr that stays the same whether the plasma level is high or low.","hook":"Not on the equation sheet: Cl = k x VD is one to know by heart. Poll: it does not rise as concentration rises.","confuse":["elimination-rate-constant","volume-of-distribution","renal-clearance","creatinine-clearance"],"quote":"Clearance is equal to k times vd.","cite":"2IVBolusAdministration.pdf, slides 8, 10 (PDF page numbering; deck prints no slide numbers); 4---Clearance-and-Elimination.pdf, PDF page 4 (printed slide 4); PDF page 5 (printed slide 5); transcript 08-24","src":"both"},{"id":"total-body-clearance","term":"Total body clearance (ClT)","group":"Elimination and clearance","def":"Total Body Clearance: ClT = ClR + ClH. Also called drug clearance or systemic clearance.","gist":"Sum of renal and hepatic clearance (volume of plasma cleared of drug per unit time).","scene":"A drug's 1.3 L/hr is split into 0.78 L/hr through the kidney and 0.52 L/hr through the liver.","hook":"With no subscript on Cl, assume this one is meant.","confuse":["renal-clearance","hepatic-clearance","creatinine-clearance"],"quote":"if there is no subscript, you should assume that we're talking about total body clearance","cite":"4---Clearance-and-Elimination.pdf, PDF page 8 (printed slide 8); PDF page 12 (printed slide 22); 2IVBolusAdministration.pdf, slide 8 (PDF page numbering; deck prints no slide numbers); transcript 09-14","src":"both"},{"id":"nonlinear-pharmacokinetics","term":"Nonlinear pharmacokinetics","group":"Nonlinear pharmacokinetics","def":"Models in which increased doses or chronic administration cause deviations from the profile observed with single doses of the same drug: the half-life and clearance change, and small changes in dose can give big changes in concentration.","gist":"Parameters change with dose or chronic dosing; small dose changes, big concentration changes.","scene":"Raising a patient's daily dose from 6 to 8 mg/kg/day doubles the steady-state level, from 10 to 20 mg/L.","hook":"Phenytoin is the course's prototype.","confuse":["linear-pharmacokinetics","saturable-pharmacokinetics","zero-order"],"quote":"small changes in dose will lead to big changes in concentration.","cite":"8 - Nonlinear PK.pdf, slides 3, 14, 19 (PDF page numbering); transcript 10-14","src":"both"}],"qs":[{"id":"ws6-i3-2c","tier":"new","concept":"clearance-constant-with-dose","source":"slide","stem":"2. A patient is receiving his antihypertensive medication as 500 mg every 8 hours in the form of an oral capsule. The bioavailability of the drug from this capsule is 80% and the total body clearance in this patient is 2.5 L/hr. c. What is the ClT of the drug in this patient while taking the 1000 mg orally every 8 hours?","options":[{"t":"2.5 L/hr, unchanged","correct":true,"why":"Total body clearance, the volume of plasma cleared of drug per hour, belongs to the patient and the drug, not the dose. Doubling the dose doubles the rate of elimination, ClT × Cp, because Cp doubles; ClT stays 2.5 L/hr."},{"t":"5 L/hr, twice the clearance","why":"This reads clearance as a quantity that scales with the dose, which it does not. What doubles is the rate of elimination, ClT × Cp; the clearance stays 2.5 L/hr."},{"t":"1.25 L/hr, half the clearance","why":"This reads a higher concentration as a slower-clearing patient. Clearance is the elimination rate over the concentration, and both double together, so the ratio stays 2.5 L/hr."},{"t":"2.0 L/hr, the clearance times F","why":"Multiplying clearance by the bioavailability mixes two different quantities. F is the fraction of the oral dose reaching the circulation; clearance is how fast the circulation is cleared. F enters Cavg∞ = {{frac:FD0|ClT τ}}, not ClT."}],"cite":"Multiple-IV-Infusion-and-Multiple-Oral-Solution-3.pdf, problem 2, part c","teach":[{"h":"Clearance does not change with the dose","t":"Clearance is constant because elimination is first order: Cl = {{frac:rate of elimination|Cp}} is the proportionality factor (Module 4 slide \"Clearance\")."},{"t":"It would change only if elimination saturated, which is nonlinear pharmacokinetics."},{"t":"Cavg∞ = {{frac:FD0|ClT τ}} is therefore proportional to the dose: twice the dose, twice the average."}]}]};
/* Basic-Pharmacokinetics src/views.js lines 19-34 (SUBSYM) and 43 (RATE), at ac2eb73,
   the symbol table its formulas-in-text options carry (the same table as in
   features/formulas-in-text/test.js) */
const PK_SYMBOLS = [['Cmax∞','C<sub>max</sub><sup>∞</sup>'],['Cmin∞','C<sub>min</sub><sup>∞</sup>'],['Cavg∞','C<sub>avg</sub><sup>∞</sup>'],
  ['Cav∞','C<sub>av</sub><sup>∞</sup>'],['Dmax∞','D<sub>max</sub><sup>∞</sup>'],['Dmin∞','D<sub>min</sub><sup>∞</sup>'],
  ['Davg∞','D<sub>avg</sub><sup>∞</sup>'],['kVD','kV<sub>D</sub>'],['FD0','FD<sub>0</sub>'],
  ['AUCA','AUC<sub>A</sub>'],['AUCB','AUC<sub>B</sub>'],['AUCC','AUC<sub>C</sub>'],['Fabs','F<sub>abs</sub>'],['Frel','F<sub>rel</sub>'],
  ['Dpo','D<sub>po</sub>'],['DIV','D<sub>IV</sub>'],['DA','D<sub>A</sub>'],
  ['AUCoral','AUC<sub>oral</sub>'],['AUCiv','AUC<sub>IV</sub>'],['AUCpo','AUC<sub>po</sub>'],['AUCIV','AUC<sub>IV</sub>'],
  ['Cpeak','C<sub>peak</sub>'],['Cmax','C<sub>max</sub>'],['Cmin','C<sub>min</sub>'],['tmax','t<sub>max</sub>'],
  ['Css','C<sub>ss</sub>'],['ClT','Cl<sub>T</sub>'],['ClR','Cl<sub>R</sub>'],['ClH','Cl<sub>H</sub>'],['SCr','S<sub>Cr</sub>'],
  ['k12','k<sub>12</sub>'],['k21','k<sub>21</sub>'],['Cp0','C<sub>p</sub><sup>0</sup>'],['Cp','C<sub>p</sub>'],['Cs','C<sub>s</sub>'],
  ['C0','C<sub>0</sub>'],['D0','D<sub>0</sub>'],['k0','k<sub>0</sub>'],['DB','D<sub>B</sub>'],['DL','D<sub>L</sub>'],['Du','D<sub>u</sub>'],
  ['VD','V<sub>D</sub>'],['Vp','V<sub>p</sub>'],['Vt','V<sub>t</sub>'],['Vc','V<sub>c</sub>'],
  ['ka','k<sub>a</sub>'],['ke','k<sub>e</sub>'],['km','k<sub>m</sub>'],['fe','f<sub>e</sub>'],
  ['C1','C<sub>1</sub>'],['C2','C<sub>2</sub>'],['t1','t<sub>1</sub>'],['t2','t<sub>2</sub>'],['Ct','C<sub>t</sub>'],
  ['Cn','C<sub>n</sub>'],['tn','t<sub>n</sub>']];
const PK_RATES = ['k0', 'ka', 'ke', 'km'];
const pre = 'gtp-';
const fixTerms = (fig, F) => (F || FIX).terms.map(t => Object.assign({}, t, {id: pre + t.id, confuse: (t.confuse || []).map(c => pre + c)},
  fig && t.id === 'affinity' ? {fig} : {}));
const fixFile = (hasTerms, fig, F) => '/* course terms and questions (Intro to Pharmacology 929cd62 or Basic-Pharmacokinetics ac2eb73), added by the glossary-tap test */\n' +
  (hasTerms ? `TERMS.length = 0; TERMS.push(...${JSON.stringify(fixTerms(fig, F))});\n` : `const TERMS = ${JSON.stringify(fixTerms(fig, F))};\n`) +
  (F || FIX).qs.map(q => `QUESTIONS.push(Object.assign(${JSON.stringify(Object.assign({}, q, {id: pre + q.id, concept: pre + q.concept}))},
  {prof: COURSE.professors[0], topic: TOPICS[0].id, sub: TOPICS[0].subs[0].id, skill: COURSE.skills[0].id}));`).join('\n') + '\n';
const affinity = FIX.terms.find(t => t.id === 'affinity');
/* the core's own bracketed gloss of "affinity", in the term's own words; an
   explanation that says "staying bound" defines it itself, so the core leaves it */
const glossLine = `\n;GLOSS.push({k: 'gtp-affinity', p: 'affinity', d: ${JSON.stringify(affinity.gist)}, skip: /staying bound/i});\n`;
/* the two guide sections; section 4 given the template's word list (dt) for efficacy, with the term's own definition */
const efficacy = FIX.terms.find(t => t.id === 'efficacy');
const guideFix = FIX.guide.replace(/id="guide-/g, 'id="gtp-guide-').replace(/(<h4>What it is<\/h4>\n<ul>\n<li><b>Orthosteric)/,
    `<h4>What it is</h4>\n<dl class="gwords"><dt>Efficacy</dt><dd>${efficacy.def}</dd></dl>\n<ul>\n<li><b>Orthosteric`)
  .replace(/(<\/small><\/li>)\n<h3/, '$1\n</ul>\n<h3') + '\n</ul>\n';
/* Intro to Pharmacology guide4.js lines 1015 and 1064 (929cd62): a section whose
   only mention of "drug" is inside a link; the heading given an id */
const GUIDE4 = "<h3>23. The FDA tables: pharmacogenetic associations and biomarkers in drug labeling</h3>\n<p><b>The live FDA pages.</b> Both tables are linked from her slides, and she opened them in class on 10/27: <a href=\"https://www.fda.gov/medical-devices/precision-medicine/table-pharmacogenetic-associations\" target=\"_blank\" rel=\"noopener\">Table of Pharmacogenetic Associations \u2197</a> (FDA page updated September 10, 2026; 82 entries in Section 1, 25 in Section 2, 40 in Section 3) and <a href=\"https://www.fda.gov/drugs/science-and-research-drugs/table-pharmacogenomic-biomarkers-drug-labeling\" target=\"_blank\" rel=\"noopener\">Table of Pharmacogenomic Biomarkers in Drug Labeling \u2197</a> (FDA page updated August 12, 2026). The FDA updates both pages, so counts and entries can differ from her slides.</p>".replace('<h3>23.', '<h3 id="gtp-guide-23">23.');
/* with formulas-in-text: Basic-Pharmacokinetics' ws6-i3-2c concept heading and the
   part of its first line after the colon, the one place in that course's bank where
   a term's name is inside a {{frac:}} (the rest of the line names it earlier); and
   its guide.js line 94, a quotation of the professor in <q> that names pharmacokinetics */
const pkLine = FIXPK.qs[0].teach[0].t;
const PKQ = "<li><q class=\"para\">Pharmacodynamics is concentration and response; pharmacokinetics is concentration and time.</q> (08-17, restated from a garbled caption)</li>";
const GUIDEPK = `<h3 id="gtp-guide-pk">${FIXPK.qs[0].teach[0].h}</h3>\n<p>${pkLine.slice(pkLine.indexOf(': ') + 2)}</p>\n<ul>\n${PKQ}\n</ul>\n`;
const addGuide = (src, html) => {
  const f = path.join(src, 'guide.js'), s = fs.readFileSync(f, 'utf8'), at = s.lastIndexOf('`;');
  if(at > 0) fs.writeFileSync(f, s.slice(0, at) + '\n<section class="gobj" id="gtp-guide">\n' + html + '</section>\n' + s.slice(at));
};
const editFor = (glossOn, guideOn) => src => {
  if(glossOn) fs.appendFileSync(path.join(src, 'glossary.js'), glossLine);
  if(guideOn) addGuide(src, guideFix + GUIDE4 + '\n');
};

/* the build step, run in node as build.py runs it */
function step(terms, opt, extra){
  const sb = Object.assign({console, COURSE: {lectures: [{id: 'L01'}]}, DIA: {'fig-a': '<figure></figure>'}, OPT: opt || {}, STEP: null}, extra || {});
  if(terms !== undefined) sb.TERMS = terms;
  vm.createContext(sb);
  try { vm.runInContext(fs.readFileSync(path.join(HERE, 'step.js'), 'utf8'), sb); return {ok: true, step: sb.STEP}; }
  catch(e){ return {ok: false, msg: String(e.message)}; }
}

(async () => {
  console.log('\n=== the course\'s own terms ===');
  L.PAGE.need(NAME);
  const E = L.engine('({TERMS: typeof TERMS === "undefined" ? null : TERMS, QUESTIONS, FX})');
  const api = E.FX && E.FX.api('glossary-tap');
  check(!!api, 'the module loads in the course\'s page and offers its finder', E.FX && E.FX.errors);
  if(api){
    const own = E.TERMS || [];
    if(!own.length) L.skip('the course\'s own terms', 'TERMS is empty');
    else {
      const miss = own.filter(t => { const f = api.find(api.nameOf(t)); return !f.length || f[0][0] !== t.id; });
      check(!miss.length, `all ${own.length} terms are found by their own name, as themselves`, miss.slice(0, 5).map(t => t.id + ': ' + api.nameOf(t)).join('; '));
      const named = new Set();
      E.QUESTIONS.forEach(q => api.find([...(q.options || []).map(o => o.why || ''), JSON.stringify(q.teach || '')].join(' ')).forEach(([id]) => named.add(id)));
      console.log(`  info  ${named.size} of ${own.length} terms are named in the bank's explanations`);
    }
  }

  console.log('\n=== the build step ===');
  const good = fixTerms('fig-a').map(t => Object.assign({}, t, {lecture: 'L01'}));
  const g = step(good);
  const nG = new Set(good.map(t => t.group)).size;
  check(g.ok && g.step.terms === good.length && g.step.groups === nG, `${good.length} of the course's terms in ${nG} groups pass`, g);
  const cases = [
    ['no TERMS', undefined, null, /reads TERMS/],
    ['an empty TERMS', [], null, /TERMS is empty/],
    ['an id used twice', good.concat([Object.assign({}, good[1], {term: 'Another name'})]), null, /gtp-drug: the id is used twice/],
    ['a term with no definition', good.map((t, i) => i === 2 ? Object.assign({}, t, {def: ''}) : t), null, /gtp-receptor has no def/],
    ['a figure not in DIA', good.map((t, i) => i === 3 ? Object.assign({}, t, {fig: 'no-such-fig'}) : t), null, /fig "no-such-fig" is not a figure/],
    ['a lecture not in COURSE.lectures', good.map((t, i) => i === 0 ? Object.assign({}, t, {lecture: 'L99'}) : t), null, /lecture "L99" is not an id/],
    ['two terms found by the same name', good.concat([Object.assign({}, good[1], {id: 'gtp-drug-2', term: 'Drug (medicine)'})]), null, /both found by the name "drug"/],
    ['a notTapped id that is not a term', good, {notTapped: ['gtp-nowhere']}, /notTapped names "gtp-nowhere"/],
  ];
  for(const [label, terms, opt, re] of cases){
    const r = step(terms, opt);
    check(!r.ok && re.test(r.msg), `${label} stops the step with its reason`, r.msg || 'it passed');
  }
  const broken = L.scratchBuild('gtap-broken', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS) + 'TERMS.push(Object.assign({}, TERMS[0], {id: "gtp-twice"}));\n'}});
  check(broken.code !== 0 && /both found by the name/.test(broken.out) && !fs.existsSync(broken.page), 'a duplicate name stops the build, with no page written', broken.out.split('\n').pop());
  broken.rm();

  console.log('\n=== worked in the browser (scratch copy) ===');
  const figKey = await (async () => { const X = L.engine('(typeof DIA === "undefined" ? {} : DIA)'); return Object.keys(X).filter(k => k !== 'storage')[0] || null; })();
  const s = L.scratchBuild('gtap', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS, figKey)}, edit: editFor(true, true)});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test terms does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page);
    const nav = await page.evaluate(() => [...document.querySelectorAll('#nav button')].map(b => b.dataset.v));
    check(nav.includes('glossary') && nav.indexOf('glossary') === nav.indexOf('settings') - 1, 'the Glossary tab is in the nav, before Settings', nav);
    if(!nav.includes('glossary')){ await browser.close(); s.rm(); L.finish(NAME); }   // nothing else can be checked
    await page.click('#nav button[data-v="glossary"]');
    const tab = await page.evaluate(() => ({n: document.querySelectorAll('#v-glossary .gterm').length,
      heads: [...document.querySelectorAll('#gtlist h3')].map(h => h.textContent),
      cards: [...document.querySelectorAll('#v-glossary .gterm')].map(d => ({id: d.id, cite: !!d.querySelector('.cite') && d.querySelector('.cite').textContent, text: d.textContent})),
      figs: document.querySelectorAll('#v-glossary .gterm .gtfig figure, #v-glossary .gterm .gtfig svg').length,
      count: document.getElementById('gtcount').textContent}));
    const groups = [...new Set(FIX.terms.map(t => t.group))];
    check(tab.n === FIX.terms.length, `the glossary shows the ${FIX.terms.length} terms (IP browser_test.js line 55)`, tab.n);
    check(JSON.stringify(tab.heads) === JSON.stringify(groups), 'under their groups, in the course\'s order', tab.heads);
    const badCard = FIX.terms.filter(t => { const c = tab.cards.find(x => x.id === 'gt-' + pre + t.id);
      // the source as Intro to Pharmacology prints it (app.js fmtCite: an approximate range ~21–~22 reads ~21–22)
      return !(c && c.text.includes(t.def) && c.cite === t.cite.replace(/–~/g, '–') && (!t.gist || c.text.includes(t.gist)) && (!t.scene || c.text.includes('In action: ' + t.scene))); });
    check(!badCard.length, 'each card has the term\'s definition, one-line meaning, situation and source', badCard.map(t => t.id));
    if(figKey) check(tab.figs >= 1, 'a term with a figure shows it (IP browser_test.js line 56)', tab.figs);
    else L.skip('a term\'s figure', 'the course has no DIA figure to point a term at');
    check(tab.count === `${FIX.terms.length} terms`, 'the count line', tab.count);

    await page.fill('#gtsearch', 'receptor');
    const sr = await page.evaluate(() => ({heads: [...document.querySelectorAll('#gtlist h3')].map(h => h.textContent),
      first: [...document.querySelectorAll('#gtlist .panel')][0] ? [...document.querySelectorAll('#gtlist .panel')][0].querySelectorAll('.gterm').length : 0,
      ids: [...document.querySelectorAll('#gtlist .gterm')].map(d => d.id), count: document.getElementById('gtcount').textContent,
      clear: !document.getElementById('gtclear').hidden}));
    const want = FIX.terms.filter(t => [t.term, t.gist, t.def, t.scene].join(' ').toLowerCase().includes('receptor'));
    const wantNamed = want.filter(t => t.term.toLowerCase().includes('receptor'));
    check(sr.heads[0] === 'Term names with “receptor”' && sr.first === wantNamed.length && sr.heads[1] === 'Also mentioned in',
      `a search lists the ${wantNamed.length} names that match first, then the terms that mention the word`, sr);
    check(sr.ids.length === want.length && sr.count === `${want.length} matches` && sr.clear, `${want.length} matches, counted, with Clear shown`, sr.count);
    await page.fill('#gtsearch', 'zzqx');
    check(await page.evaluate(() => /No term matches/.test(document.getElementById('gtlist').textContent)), 'a search with no match says so');
    await page.click('#gtclear');
    check(await page.evaluate(n => document.querySelectorAll('#gtlist .gterm').length === n && document.getElementById('gtsearch').value === '', FIX.terms.length),
      'Clear empties the box and shows every term again');

    const letters = await page.evaluate(() => [...document.querySelectorAll('[data-gtlt]')].map(b => [b.dataset.gtlt, b.disabled]));
    const have = new Set(FIX.terms.map(t => t.term[0].toUpperCase()));
    check(letters.every(([L, d]) => d === !have.has(L)), 'the letters with no term are disabled', letters.filter(([L, d]) => d === have.has(L)));
    await page.click('[data-gtlt="O"]');
    const az = await page.evaluate(() => ({order: document.querySelector('[data-gtorder="az"]').getAttribute('aria-pressed'),
      heads: [...document.querySelectorAll('#gtlist h3')].map(h => h.textContent), at: !!document.getElementById('gtl-O')}));
    check(az.order === 'true' && az.at && JSON.stringify(az.heads) === JSON.stringify([...have].sort()), 'a letter switches to A-Z order, by first letter, and jumps to it', az);
    await page.click('[data-gtorder="group"]');
    await page.click(`[data-gtgroup="${groups[1]}"]`);
    const gr = await page.evaluate(() => [...document.querySelectorAll('#gtlist .gterm')].map(d => d.id));
    const inG = FIX.terms.filter(t => t.group === groups[1]).map(t => 'gt-' + pre + t.id);
    check(JSON.stringify(gr) === JSON.stringify(inG), `a group chip shows that group only (${inG.length} terms)`, gr);
    await page.click('[data-gtgroup="all"]');
    await page.setViewportSize({width: 390, height: 500});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const fb = await page.evaluate(() => !!document.getElementById('gtback'));
    if(await page.evaluate(() => document.body.scrollHeight > window.innerHeight + 200)){
      check(fb, 'the floating button appears once the search bar is off screen');
      await page.click('#gtback'); await page.waitForTimeout(600);
      check(await page.evaluate(() => !document.getElementById('gtback')), 'and goes once it is used');
    } else L.skip('the floating button', 'the glossary is too short to scroll at this size');
    await page.setViewportSize({width: 390, height: 844});

    // tap a term, on L02-023 (no core gloss: its explanation defines affinity itself)
    await L.quizOn(page, pre + 'L02-023');
    check(await page.evaluate(() => document.querySelectorAll('#v-quiz .gtap').length === 0), 'before the answer is shown, no term is marked');
    await page.evaluate(() => document.querySelector('#v-quiz .opt[data-o="0"], #v-quiz button[data-o="0"]').click());
    await page.waitForTimeout(200);
    const t1 = await page.evaluate(() => ({ids: [...document.querySelectorAll('#v-quiz .gtap')].map(b => b.dataset.term),
      inStem: document.querySelectorAll('#v-quiz .stem .gtap').length, inLabel: document.querySelectorAll('#v-quiz .wtxt > b .gtap').length,
      inVerdict: document.querySelectorAll('#v-quiz .verdict .gtap').length, gloss: document.querySelectorAll('#v-quiz .gloss').length,
      inCite: document.querySelectorAll('#v-quiz .cite .gtap').length, cite: (document.querySelector('#v-quiz .cite') || {}).textContent || ''}));
    const ids23 = t1.ids;
    check(ids23.length && new Set(ids23).size === ids23.length, `after the answer, ${ids23.length} terms are marked, each once`, ids23);
    check(['affinity', 'efficacy', 'pharmacodynamics', 'receptor'].every(id => ids23.includes(pre + id)), 'affinity, efficacy, pharmacodynamics and receptor among them', ids23);
    check(!t1.inStem && !t1.inLabel && !t1.inVerdict, 'none in the stem, an option\'s own text or the verdict', t1);
    check(!t1.inCite && /efficacy/i.test(t1.cite), 'none in the source line, whose quoted words name efficacy', t1);
    check(t1.gloss === 0, 'the core gave no bracketed gloss here (the explanation defines affinity itself)', t1.gloss);
    await page.click(`#v-quiz .gtap[data-term="${pre}affinity"]`);
    const box = await page.evaluate(() => { const b = document.querySelector('#v-quiz .gtap-box'); return b && {text: b.textContent, open: document.querySelector('#v-quiz .gtap[aria-expanded="true"]').dataset.term,
      after: !!(b.previousElementSibling && b.previousElementSibling.classList.contains('wrow'))}; });
    check(box && box.text.includes(affinity.def) && box.text.includes(affinity.gist) && box.text.includes(affinity.cite) && box.open === pre + 'affinity' && box.after,
      'a tap opens the term\'s definition, meaning and source under the line', box);
    await page.click(`#v-quiz .gtap[data-term="${pre}affinity"]`);
    check(await page.evaluate(() => !document.querySelector('#v-quiz .gtap-box') && document.querySelector('#v-quiz .gtap[aria-expanded="true"]') === null), 'a second tap closes it');
    await page.click(`#v-quiz .gtap[data-term="${pre}efficacy"]`);
    await page.click('#v-quiz .gtap-box [data-gtopen]');
    const jumped = await page.evaluate(id => ({view: VIEW, there: !!document.getElementById('gt-' + id), back: (document.getElementById('backbtn') || {}).textContent || ''}), pre + 'efficacy');
    check(jumped.view === 'glossary' && jumped.there && /Back to the question/.test(jumped.back), '"Open in the Glossary" opens the tab at the term, with the way back to the question', jumped);

    // L02-018: the core glosses "affinity" in brackets, so the tap leaves it there
    await L.quizOn(page, pre + 'L02-018');
    await page.evaluate(() => document.querySelector('#v-quiz button[data-o="1"]').click());
    await page.waitForTimeout(200);
    const t2 = await page.evaluate(() => ({ids: [...document.querySelectorAll('#v-quiz .gtap')].map(b => b.dataset.term), gloss: document.querySelectorAll('#v-quiz .gloss').length}));
    check(t2.gloss === 1 && !t2.ids.includes(pre + 'affinity') && t2.ids.includes(pre + 'efficacy'), 'a term the core has glossed in brackets is not a button in that question; the others are', t2);

    // the Guides tab: once per section
    await page.click('#nav button[data-v="guide"]');
    const gd = await page.evaluate(p => { const sec = id => { const h = document.getElementById(id); const out = []; let n = h && h.nextElementSibling;
        while(n && n.tagName !== 'H3'){ n.querySelectorAll('.gtap').forEach(b => out.push(b.dataset.term)); n = n.nextElementSibling; } return out; };
      return {one: sec(p + 'guide-1'), four: sec(p + 'guide-4'), inH: document.querySelectorAll('#v-guide h3 .gtap').length}; }, pre);
    check(gd.one.includes(pre + 'affinity') && gd.one.includes(pre + 'efficacy') && new Set(gd.one).size === gd.one.length, 'in a guide section each term is marked once', gd.one);
    check(gd.four.includes(pre + 'affinity') && !gd.four.includes(pre + 'efficacy'), 'a new section marks affinity again, but not efficacy, which its word list defines', gd.four);
    check(gd.inH === 0, 'no heading holds a button', gd.inH);
    await page.click(`#v-guide .gtap[data-term="${pre}affinity"]`);
    check(await page.evaluate(d => { const b = document.querySelector('#v-guide .gtap-box'); return !!b && b.textContent.includes(d) && b.parentElement.tagName === 'LI'; }, affinity.def), 'a tap in a guide opens the definition inside that line');

    // the finder in the page: every term by its own name (Receptor tyrosine kinase is not read as Receptor), and a plural
    const fnd = await page.evaluate(([ts, txt]) => { const a = FX.api('glossary-tap');
      return {miss: ts.filter(t => { const f = a.find(a.nameOf(t)); return !f.length || f[0][0] !== t.id; }).map(t => t.id), plural: a.find(txt)}; },
      [fixTerms(null), FIX.qs.find(q => q.id === 'T-affinity-3').teach.split('. ').find(x => /receptors/.test(x))]);
    check(!fnd.miss.length, `in the page, each of the ${FIX.terms.length} terms is found by its own name, as itself`, fnd.miss);
    check(fnd.plural.some(([id, w]) => id === pre + 'receptor' && w === 'receptors'), 'a plural is found: "receptors" in T-affinity-3\'s concept block is Receptor', fnd.plural);

    // a link: guide4's section 23 names "drug" only inside a link, so nothing is marked there
    const lk = await page.evaluate(p => { const h = document.getElementById(p + 'guide-23'); const out = []; let n = h && h.nextElementSibling;
      while(n && n.tagName !== 'H3'){ n.querySelectorAll('.gtap').forEach(b => out.push(b.dataset.term)); n = n.nextElementSibling; }
      return {there: !!h, ids: out, links: h ? [...h.parentElement.querySelectorAll('a')].filter(a => /Drug Labeling/.test(a.textContent)).length : 0,
        inLink: document.querySelectorAll('#v-guide a .gtap').length}; }, pre);
    check(lk.there && lk.links === 1 && !lk.ids.includes(pre + 'drug') && lk.inLink === 0, 'a term inside a link is not marked (guide4 section 23 names "drug" only in a link)', lk);

    // the exam review: the same marking, per question card
    await page.evaluate(ids => { show('exam'); EX = {qs: ids.map(byId), i: 0, picks: ids.map(() => 0), orders: ids.map(id => byId(id).options.map((o, k) => k)),
      running: true, done: false, started: Date.now(), ends: Date.now() + 3600000}; finishExam(false); }, [pre + 'L02-023', pre + 'L02-018']);
    await page.waitForTimeout(300);
    const ex = await page.evaluate(() => [...document.querySelectorAll('#v-exam .qcard')].map(c => ({ids: [...c.querySelectorAll('.gtap')].map(b => b.dataset.term),
      inStem: c.querySelectorAll('.stem .gtap').length, inLabel: c.querySelectorAll('.wtxt > b .gtap').length, inCite: c.querySelectorAll('.cite .gtap').length})));
    check(ex.length === 2 && ex.every(c => c.ids.length && new Set(c.ids).size === c.ids.length && !c.inStem && !c.inLabel && !c.inCite),
      'the exam review marks terms in each question card, each once, none in the stem, an option\'s own text or the source line', ex);
    check(ex.length === 2 && ex[1].ids.includes(pre + 'affinity') && ex[1].ids.includes(pre + 'efficacy'),
      'L02-018 in the exam review marks affinity (the review has no bracketed gloss) and efficacy', ex[1]);
    await page.click(`#v-exam .qcard:nth-of-type(1) .gtap[data-term="${pre}affinity"], #v-exam .gtap[data-term="${pre}affinity"]`);
    check(await page.evaluate(d => { const b = document.querySelector('#v-exam .gtap-box'); return !!b && b.textContent.includes(d); }, affinity.def), 'a tap in the exam review opens the definition');

    /* quoted words: a term inside a quotation (in quotation marks, or the source
       line's quote) is not marked; a quotation that is only a term's name is. In
       an exam review with the options in their own order, so that T-affinity-3's
       first mention of "receptor" is inside its quotation of the poll sentence. */
    await page.evaluate(ids => { show('exam'); EX = {qs: ids.map(byId), i: 0, picks: ids.map(() => 0), orders: ids.map(id => byId(id).options.map((o, k) => k)),
      running: true, done: false, started: Date.now(), ends: Date.now() + 3600000}; finishExam(false); }, [pre + 'T-affinity-3', pre + 'L10-030']);
    await page.waitForTimeout(300);
    const qs2 = await page.evaluate(() => [...document.querySelectorAll('#v-exam .qcard')].map(card => ({text: card.textContent,
      cite: (card.querySelector('.cite') || {}).textContent || '', inCite: card.querySelectorAll('.cite .gtap').length,
      marks: [...card.querySelectorAll('.wtxt .gtap, .teach .gtap')].map(b => {
        const blk = b.closest('.wtxt, p, li') || b.parentElement, r = document.createRange();
        r.setStart(blk, 0); r.setEndBefore(b); const before = r.toString();
        r.setStartAfter(b); r.setEnd(blk, blk.childNodes.length); const after = r.toString();
        return {term: b.dataset.term, open: (before.split('“').length - before.split('”').length) > 0, nameOnly: /“$/.test(before) && /^”/.test(after)};
      })})));
    const [qa, qc] = qs2;
    check(qa && qa.text.includes('“the ability of a drug to bind and stay bound to a receptor”') && qa.marks.some(x => x.term === pre + 'receptor') && !qa.marks.some(x => x.open),
      'T-affinity-3: no term marked inside its quotation of the poll sentence, which stays whole; receptor is marked at its next mention', qa && qa.marks);
    check(qa && /Pharmacodynamics-Day/.test(qa.cite) && !qa.marks.some(x => x.term === pre + 'pharmacodynamics') && qa.inCite === 0,
      'T-affinity-3: its source line names Pharmacodynamics (a deck name) and nothing is marked there', qa && {cite: qa.cite, inCite: qa.inCite});
    const ce = qc && qc.marks.find(x => x.term === pre + 'cheese-effect');
    check(ce && ce.nameOnly && qc.marks.filter(x => x.open).every(x => x.nameOnly), 'L10-030: “cheese effect”, a quotation of the name alone, is marked', qc && qc.marks);

    /* what the module stores: nothing. The page's saved data is the same before
       and after the glossary is searched and terms are tapped and opened. */
    const snap = () => page.evaluate(() => { const o = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    await page.waitForTimeout(400);
    const s0 = await snap();
    await page.click('#nav button[data-v="glossary"]');
    await page.fill('#gtsearch', 'receptor'); await page.click('#gtclear');
    await page.click('[data-gtlt="A"]'); await page.click('[data-gtorder="group"]');
    await page.click(`[data-gtgroup="${groups[1]}"]`); await page.click('[data-gtgroup="all"]');
    await page.click('#nav button[data-v="guide"]');
    await page.click(`#v-guide .gtap[data-term="${pre}efficacy"]`);
    await page.click('#v-guide .gtap-box [data-gtopen]');
    await page.waitForTimeout(400);
    const s1 = await snap();
    const changed = [...new Set(Object.keys(s0).concat(Object.keys(s1)))].filter(k => s0[k] !== s1[k]);
    check(Object.keys(s0).length > 0 && !changed.length, `the module stores nothing: the ${Object.keys(s0).length} saved keys are unchanged after the glossary and taps are used`, changed);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();

    // storage blocked or full: the module stores nothing, so the tab and the taps still work
    for(const [label, err] of [['blocked', 'SecurityError'], ['full', 'QuotaExceededError']]){
      const p3 = await L.openPage(browser, s.page, null, `Storage.prototype.setItem = function(){ throw new DOMException('no', ${JSON.stringify(err)}); };`);
      await p3.page.click('#nav button[data-v="glossary"]');
      const nT = await p3.page.evaluate(() => document.querySelectorAll('#v-glossary .gterm').length);
      await L.quizOn(p3.page, pre + 'L02-023');
      await p3.page.evaluate(() => document.querySelector('#v-quiz button[data-o="0"]').click());
      await p3.page.waitForTimeout(200);
      await p3.page.click(`#v-quiz .gtap[data-term="${pre}affinity"]`);
      const r3 = await p3.page.evaluate(() => ({box: !!document.querySelector('#v-quiz .gtap-box'), fx: FX.errors.map(e => e.module + ': ' + e.message)}));
      check(nT === FIX.terms.length && r3.box && !r3.fx.length && !p3.errors.length, `with storage ${label} (setItem throws ${err}), the glossary and the taps work`, {nT, r3, errors: p3.errors});
      await p3.ctx.close();
    }
  } finally {
    s.rm();
  }

  console.log('\n=== the options ===');
  const o = L.scratchBuild('gtap-opts', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS, null)}, courseLine: L.featureOn(HERE, {notTapped: [pre + 'drug']})});
  const off = L.scratchBuild('gtap-off', {files: {'q94_gtap_test.js': fixFile(!!E.TERMS, null)}, courseLine: L.featureOn(HERE, {tap: false})});
  try {
    if(o.code !== 0 || off.code !== 0) check(false, 'the scratch copies with notTapped and tap off build', (o.out + '\n' + off.out).split('\n').filter(l => /ERROR/.test(l)).join(' | '));
    else {
      const p1 = await L.openPage(browser, o.page);
      const f = await p1.page.evaluate(() => FX.api('glossary-tap').find('the drug binds the receptor').map(x => x[0]));
      check(JSON.stringify(f) === JSON.stringify([pre + 'receptor']), 'with notTapped, that term is no longer found', f);
      await p1.ctx.close();
      const p2 = await L.openPage(browser, off.page);
      await L.quizOn(p2.page, pre + 'L02-023');
      await p2.page.evaluate(() => document.querySelector('#v-quiz button[data-o="0"]').click());
      await p2.page.waitForTimeout(200);
      const n = await p2.page.evaluate(() => ({tap: document.querySelectorAll('#v-quiz .gtap').length, tab: !!document.querySelector('#nav button[data-v="glossary"]')}));
      check(n.tap === 0 && n.tab, 'with tap off, nothing is marked and the Glossary tab stays', n);
      await p2.ctx.close();
    }
  } finally {
    o.rm(); off.rm();
  }

  /* With formulas-in-text, which also rewrites explanation text after it is drawn.
     Its hook and this module's run in course.js order, so both orders are built,
     with a third copy that has formulas-in-text alone. Each explanation and the
     concept block, with the term buttons put back to plain text, must be exactly
     what formulas-in-text alone draws (fractions stacked, subscripts set, no other
     markup); every term must be found; the fraction must stack. */
  console.log('\n=== with formulas-in-text ===');
  const FXDIR = path.join(L.PAGE.SRC, 'features', 'formulas-in-text');
  if(!fs.existsSync(path.join(FXDIR, 'module.json'))){
    L.skip('glossary-tap with formulas-in-text', 'formulas-in-text is not in this course (src/features/formulas-in-text): copy it in to run these checks');
  } else {
    const fxOpt = {symbols: PK_SYMBOLS, rates: PK_RATES};
    const order = names => `COURSE.features = (f => { const o = {}; ${JSON.stringify(names)}.forEach(n => { if(f[n]) o[n] = f[n]; }); return Object.assign(o, f); })(COURSE.features);`;
    const pkFile = {'q94_gtap_test.js': fixFile(!!E.TERMS, null, FIXPK)};
    const pkEdit = src => addGuide(src, GUIDEPK);
    const builds = [
      ['formulas-in-text alone', ['formulas-in-text'], L.featureOn(FXDIR, fxOpt) + 'delete COURSE.features["glossary-tap"];'],
      ['formulas-in-text first', ['formulas-in-text', 'glossary-tap'], L.featureOn(HERE) + L.featureOn(FXDIR, fxOpt) + order(['formulas-in-text', 'glossary-tap'])],
      ['glossary-tap first', ['glossary-tap', 'formulas-in-text'], L.featureOn(HERE) + L.featureOn(FXDIR, fxOpt) + order(['glossary-tap', 'formulas-in-text'])],
    ].map(([label, names, line]) => ({label, names, b: L.scratchBuild('gtap-fx', {files: pkFile, courseLine: line, edit: pkEdit})}));
    const qid = pre + FIXPK.qs[0].id;
    /* one page: the quiz card after the answer, the exam review and the guide
       section, each as {html: the text with buttons put back, ids, ...} */
    const look = (sel) => {
      const plainHTML = el => { const c = el.cloneNode(true); c.querySelectorAll('.gtap-box').forEach(x => x.remove());
        c.querySelectorAll('button.gtap').forEach(b => b.replaceWith(document.createTextNode(b.textContent)));
        c.normalize(); c.removeAttribute('data-gtap'); return c.innerHTML.replace(/^<b>[A-Z]\. /, '<b>'); };
      const root = document.querySelector(sel);
      const parts = [...root.querySelectorAll('.wtxt, .teach')];
      const api = FX.api('glossary-tap');
      const btn = [...root.querySelectorAll('.gtap')];
      const fr = [...root.querySelectorAll('.frac')].map(f => { const n = f.querySelector(':scope > .fn'), d = f.querySelector(':scope > .fd');
        if(!n || !d) return {ok: false}; const a = n.getBoundingClientRect(), b = d.getBoundingClientRect();
        return {ok: a.bottom <= b.top + 1 && a.height > 0 && b.height > 0, fn: n.textContent, tapped: !!n.querySelector('.gtap')}; });
      return {html: parts.map(plainHTML).sort(), ids: btn.map(b => b.dataset.term),
        named: api ? api.find(parts.map(p => p.textContent).join(' \n ')).map(x => x[0]).sort() : null,
        wordsOk: !api || btn.every(b => { const f = api.find(b.textContent); return f.length === 1 && f[0][0] === b.dataset.term && f[0][1] === b.textContent; }),
        nested: root.querySelectorAll('.gtap .gtap, .gtap sub, .gtap sup, .gtap .frac').length,
        raw: /\{\{frac:|<\/?(sub|sup|span|button)\b/.test(root.textContent), fracs: fr, subs: root.querySelectorAll('.wtxt sub, .teach sub').length,
        modules: FX.modules().filter(m => m.on).map(m => m.name)};
    };
    const nFrac = (FIXPK.qs[0].options.map(o => o.why).join(' ') + FIXPK.qs[0].teach.map(t => t.t).join(' ')).split('{{frac:').length - 1;
    const fb = await L.launch(NAME);
    const seen = {};
    try {
      for(const {label, names, b} of builds){
        if(b.code !== 0){ check(false, `${label}: the scratch copy builds`, b.out.split('\n').filter(l => /ERROR/.test(l)).join(' | ')); continue; }
        const P = await L.openPage(fb.browser, b.page);
        await L.quizOn(P.page, qid);
        await P.page.evaluate(() => document.querySelector('#v-quiz button[data-o="0"]').click());
        await P.page.waitForTimeout(250);
        const quiz = await P.page.evaluate(look, '#v-quiz .why');
        await P.page.evaluate(id => { show('exam'); EX = {qs: [byId(id)], i: 0, picks: [0], orders: [byId(id).options.map((o, k) => k)],
          running: true, done: false, started: Date.now(), ends: Date.now() + 3600000}; finishExam(false); }, qid);
        await P.page.waitForTimeout(250);
        const exam = await P.page.evaluate(look, '#v-exam .qcard');
        await P.page.click('#nav button[data-v="guide"]');
        await P.page.waitForTimeout(150);
        const guide = await P.page.evaluate(() => { const h = document.getElementById('gtp-guide-pk'), p = h && h.nextElementSibling;
          if(!p) return null; const c = p.cloneNode(true); c.querySelectorAll('button.gtap').forEach(b => b.replaceWith(document.createTextNode(b.textContent))); c.normalize();
          const f = p.querySelector('.frac'), n = f && f.querySelector(':scope > .fn'), d = f && f.querySelector(':scope > .fd');
          const a = n && n.getBoundingClientRect(), z = d && d.getBoundingClientRect();
          const q = document.querySelector('#v-guide #gtp-guide-pk ~ ul q');
          return {html: c.innerHTML, ids: [...p.querySelectorAll('.gtap')].map(b => b.dataset.term), inFrac: n ? [...n.querySelectorAll('.gtap')].map(b => b.dataset.term) : [],
            q: q ? q.textContent : null, inQ: q ? q.parentElement.querySelectorAll('.gtap').length : -1,
            stacks: !!(a && z && a.bottom <= z.top + 1 && a.height > 0), raw: /\{\{frac:/.test(p.textContent)}; });
        seen[label] = {quiz, exam, guide};
        check(JSON.stringify(quiz.modules) === JSON.stringify(names), `${label}: the page runs ${names.join(', then ')}`, quiz.modules);
        for(const [where, r] of [['quiz card', quiz], ['exam review', exam]]){
          check(!r.raw && r.fracs.length === nFrac && r.fracs.every(f => f.ok) && r.subs > 0,
            `${label}, ${where}: no {{frac: or markup shown as text; the ${nFrac} fractions stack; subscripts set`, {raw: r.raw, fracs: r.fracs, subs: r.subs});
          if(names.includes('glossary-tap')){
            const want = r.named || [];
            check(want.length && JSON.stringify(r.ids.slice().sort()) === JSON.stringify(want) && r.wordsOk && !r.nested,
              `${label}, ${where}: every term named is a button, once, on its own words, holding no formula markup (${want.length} terms)`, {ids: r.ids, want, wordsOk: r.wordsOk, nested: r.nested});
            check(['elimination', 'total-body-clearance', 'plasma', 'clearance'].every(id => r.ids.includes(pre + id)),
              `${label}, ${where}: elimination (before ", ClT"), total body clearance, plasma and clearance among them`, r.ids);
            if(seen['formulas-in-text alone'])
              check(JSON.stringify(r.html) === JSON.stringify(seen['formulas-in-text alone'][where === 'quiz card' ? 'quiz' : 'exam'].html),
                `${label}, ${where}: with the buttons put back to text, each explanation and the concept block are exactly as formulas-in-text alone draws them`,
                r.html.filter((h, i) => h !== seen['formulas-in-text alone'][where === 'quiz card' ? 'quiz' : 'exam'].html[i]).slice(0, 2));
          }
        }
        check(guide && !guide.raw && guide.stacks, `${label}, guide: the fraction in the section stacks`, guide);
        if(names.includes('glossary-tap')){
          check(guide && JSON.stringify(guide.inFrac) === JSON.stringify([pre + 'elimination']), `${label}, guide: "elimination" inside the fraction's numerator is a button`, guide);
          check(guide && guide.q && /pharmacokinetics/.test(guide.q) && guide.inQ === 0, `${label}, guide: nothing is marked in the line that quotes the professor in <q> (guide.js line 94), which names pharmacokinetics`, guide && {q: guide.q, inQ: guide.inQ});
          if(seen['formulas-in-text alone']) check(guide && guide.html === seen['formulas-in-text alone'].guide.html, `${label}, guide: with the button put back, the section is as formulas-in-text alone draws it`, guide && guide.html);
          await P.page.click(`#v-guide .frac .gtap[data-term="${pre}elimination"]`);
          const gb = await P.page.evaluate(d => { const b = document.querySelector('#v-guide .gtap-box'); return {ok: !!b && b.textContent.includes(d), frac: !!document.querySelector('#gtp-guide-pk + p .frac > .fn .gtap')}; },
            FIXPK.terms.find(t => t.id === 'elimination').def);
          check(gb.ok && gb.frac, `${label}, guide: a tap on it opens the definition, and the fraction keeps its parts`, gb);
          await P.page.click('#nav button[data-v="quiz"]');
          await L.quizOn(P.page, qid);
          await P.page.evaluate(() => document.querySelector('#v-quiz button[data-o="0"]').click());
          await P.page.waitForTimeout(200);
          await P.page.click(`#v-quiz .gtap[data-term="${pre}elimination"]`);
          const qb = await P.page.evaluate(d => ({box: !!document.querySelector('#v-quiz .gtap-box') && document.querySelector('#v-quiz .gtap-box').textContent.includes(d),
            raw: /\{\{frac:/.test(document.querySelector('#v-quiz .why').textContent)}), FIXPK.terms.find(t => t.id === 'elimination').def);
          check(qb.box && !qb.raw, `${label}, quiz card: a tap opens the definition and no fraction comes undone`, qb);
        }
        const fe = await P.page.evaluate(() => FX.errors.map(e => e.module + ' ' + e.where + ': ' + e.message));
        check(!fe.length && !P.errors.length, `${label}: no module error and no page error`, fe.concat(P.errors).slice(0, 3));
        await P.ctx.close();
      }
    } finally {
      builds.forEach(x => x.b.rm());
      await fb.browser.close();
    }
  }
  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
