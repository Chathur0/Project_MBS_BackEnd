const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database_name', 'username', 'password', {
    host: 'localhost',
    dialect: 'mysql',
});

const Volunteer = require('./volunteer')(sequelize);
const VolunteerRequest = require('./Volunteerequest')(sequelize);
const Review = require('./review')(sequelize);

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database & tables created!');
    });

module.exports = {
    sequelize,
    Volunteer,
    VolunteerRequest,
    Review,
};
