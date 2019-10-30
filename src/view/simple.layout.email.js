module.exports = (body, args) => {
    return `
    Hello, ${typeof args.user !== 'undefined' ? args.user.name : ''}!
    ${body}
`};
