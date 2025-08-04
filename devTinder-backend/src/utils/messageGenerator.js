exports.generateReferralMessage = ({ firstName, skills, about, company, role }) => {
  const skillsStr = skills.join(", ");
  return `
Hi, I hope you're doing well!

I'm ${firstName}, a developer skilled in ${skillsStr}. I'm currently seeking an opportunity as a ${role} at ${company}, and I would truly appreciate a referral if you're comfortable.

Here's a bit about me: ${about.slice(0, 180)}...

Thanks so much for your time and consideration!
  `.trim();
};
