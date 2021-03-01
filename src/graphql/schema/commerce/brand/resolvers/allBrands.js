
module.exports = async (_, __, { dataSources: { repository }}) => {
  return repository.brand.getAll({ nProducts: {$gt: 0} })
    .then(brands => {
      brands.sort((a, b) => {
        const name1 = a.name.toLowerCase();
        const name2 = b.name.toLowerCase();
        const startWithAlphaBet1 = !!(name1.charAt(0).match(/[a-z]/i));
        const startWithAlphaBet2 = !!(name2.charAt(0).match(/[a-z]/i));

        if (startWithAlphaBet1 !== startWithAlphaBet2) {
          return !startWithAlphaBet1 ? 1 : -1;
        } else {
          return name1 > name2 ? 1 : -1;
        }        
      })
      return brands;
    })
}
