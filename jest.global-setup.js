// Prayer-window tests depend on local midnight; pin the zone so results match on any machine.
module.exports = async () => {
  process.env.TZ = 'Asia/Dhaka';
};
