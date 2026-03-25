const bootstrapAdmin = require('./bootstrap');
process.env.ADMIN_USER = 'admin@sunpartners.co';
process.env.ADMIN_PASSWORD = 'unused_placeholder';

bootstrapAdmin().then(() => {
    console.log('Seed Complete');
    process.exit();
}).catch(e => {
    console.error(e);
    process.exit(1);
});
