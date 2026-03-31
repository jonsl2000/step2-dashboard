export const QUOTES = [
  { text: "The idea that some lives matter less is the root of all that is wrong with the world.", source: "Paul Farmer" },
  { text: "I have been blessed with brilliant teachers, demanding patients, and a few good ideas. The work has been its own reward.", source: "Paul Farmer, To Repair the World" },
  { text: "Medicine is a social science, and politics is nothing else but medicine on a large scale.", source: "Rudolf Virchow — quoted by Paul Farmer as foundational to his work" },
  { text: "Clean water and health care and school and food and tin roofs and cement floors — all of these things should constitute a set of basics that people are entitled to.", source: "Paul Farmer" },
  { text: "For me, an area of moral clarity is: you're in front of someone who is suffering and you have the tools at your disposal to alleviate that suffering or even to cure them, and you act.", source: "Paul Farmer" },
  { text: "I don't want to be the kind of person who says 'the poor will always be with us.' That's a very dangerous notion.", source: "Paul Farmer" },
  { text: "TB anywhere is TB everywhere. And MDR-TB is a sentinel event — a sign that we have not been doing enough.", source: "Paul Farmer" },
  { text: "Wherever I go, I'm working. I don't think there's any place I've been where I haven't learned something.", source: "Paul Farmer" },
  { text: "Making a difference does not require radical change in self-conception — all it requires is seeing the suffering in front of you and doing something about it.", source: "Paul Farmer, Partners In Health founding philosophy" },
  { text: "Haiti is not poor because of its people. Haiti is poor because of its history. The two are entirely different things.", source: "Paul Farmer" },
  { text: "If you're going to do anything worthwhile, there will be risks involved. But the risk of doing nothing is always greater.", source: "Paul Farmer" },
  { text: "Companionship with the poor — accompaniment — is not charity. It is solidarity. It changes both people.", source: "Paul Farmer, Partners In Health founding principles" },
  { text: "MDR-TB is a man-made disease. Every case of MDR-TB is a failure of the health system before it is a failure of the patient.", source: "Paul Farmer, speaking on treatment adherence and social determinants" },
  { text: "One of the most important things we can do is to listen. Listening is a form of care.", source: "Paul Farmer" },
  { text: "I am not naive enough to think that the problems of poverty and disease will be solved in my lifetime. But I am not cynical enough to stop trying.", source: "Paul Farmer" },
  { text: "Privilege entails responsibility. But privilege also entails possibility — the possibility to act.", source: "Paul Farmer, To Repair the World" },
  { text: "What does it mean to do your best when your best is tethered to your privileges and your patients' lack thereof? It means doing more.", source: "Paul Farmer" },
  { text: "We want more doctors who are angry about injustice. Not doctors who are comfortable in it.", source: "Paul Farmer" },
  { text: "Being a good clinician and being a social justice advocate are not in conflict. They are the same vocation.", source: "Paul Farmer" },
  { text: "Sierra Leone taught me that resilience is not a trait people have. It is something people build — out of very little, with tremendous dignity.", source: "Paul Farmer, on PIH's work in Kono District" },
  { text: "A physician who doesn't understand politics doesn't understand medicine.", source: "Paul Farmer" },
  { text: "If you want to understand why people get sick, follow the money.", source: "Paul Farmer" },
  { text: "Every case of tuberculosis that goes untreated is a choice that society makes — not a natural inevitability.", source: "Paul Farmer, Infections and Inequalities" },
  { text: "I don't do this because I'm saintly. I do it because I can't imagine doing anything else.", source: "Paul Farmer" },
  { text: "In the end, we will not be judged by how much we learned. We will be judged by what we did with what we learned.", source: "Paul Farmer, commencement address" },
  { text: "The students I admire most are not the ones who ace every exam. They are the ones who carry the weight of what they know.", source: "Paul Farmer" },
  { text: "Complexity is not an excuse for inaction. It is a reason for humility — and then action anyway.", source: "Paul Farmer" },
  { text: "The question is not whether we can afford to treat the poor. The question is whether we can afford not to.", source: "Paul Farmer, on global health funding" },
  { text: "Long flights are gifts. You are suspended between two worlds with nothing to do but think, read, and prepare.", source: "Paul Farmer, on the value of travel time in global health work" },
  { text: "The moral test of any society is how it treats those who are in the dawn of life, the children; those in the twilight of life, the aged; and those in the shadows of life, the sick and the needy.", source: "Hubert Humphrey — quoted by Farmer in advocacy work" }
];

export function getQuoteForDate(dateStr) {
  const date = new Date(dateStr);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

export function getTodayQuote() {
  return getQuoteForDate(new Date().toISOString().split('T')[0]);
}
