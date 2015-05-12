var ids = {
    facebook: {
	clientID: '868628569866147',
	clientSecret: 'c400bf332cefe3b5e14ae5618af77cb2',
	callbackURL: 'http://lightgala.com:3000/db2/auth/facebook/callback'
    },
    twitter: {
	consumerKey: '9dqFsIjfE9bhXA38wBZYiWNPE',
	consumerSecret: 'yLWc8fRnSawHMqySBW0is23wvJKOrYA0twSmbEUUZhCGNIhkeb',
	callbackURL: 'http://lightgala.com:3000/db2/auth/twitter/callback'
    },
    github: {
	clientID: 'get_my_own',
	clientSecret: 'create_my_own',
	callbackURL: 'http://lightgala.com:3000/db2/auth/github/callback'
    },
    amazon: {
	clientID: 'amzn1.application-oa2-client.fc9921561a824e83ad7dbd26e4d4ef1e',
	clientSecret: 'c254cd0fdd5059461f344195af71f601296b5d2755a8fd9d2ddc9ef16f99f7d5',
	//requires https
	callbackURL: 'https://lightgala.com:8000/db2/auth/amazon/callback'
    },
    instagram: {
	clientID: '4da28aa7f3ec4c54a875bacb12a6ed56',
	clientSecret: '40191d39d2764093b7812af9b8073e7b',
	//requires https
	callbackURL: 'https://lightgala.com:8000/db2/auth/instagram/callback'
    },
    /*yahoo: {
	consumerKey: 'dj0yJmk9Q2Z5SWtjdVBhZTBiJmQ9WVdrOVkxSjRNMk5UTlRJbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD01NA--',
	consumerSecret: '56f67e279d3cdba722b93535c54f142ba7820105',
	//callbackURL: 'http://lighttube.com:3000/db2/auth/yahoo/callback'
	//yahoo does not allow custom port
	callbackURL: 'http://lighttube.com/db2/auth/yahoo/callback'
    },*/
    //use open id for yahoo login
    yahoo: {
	callbackURL: 'http://lightgala.com:3000/db2/auth/yahoo/callback',
	realm: 'http://lightgala.com:3000'
    },
    windowslive: {
	//clientID: '0000000044142023',
	//clientSecret: 'OSl-KW5Z2aT1Dn7ePg8eZGo3-R-PkPe7',
	clientID: '000000004C150C1D',
	clientSecret: 'c6BbTsdHfSnawtE58E9qVXt-t0wlUZua',
	callbackURL: 'http://lightgala.com:3000/db2/auth/windowslive/callback'
    },
    linkedin: {
	clientID: '770r3g20lc7k38',
	clientSecret: 'kcNzgXpFwyKiyusE',
	callbackURL: 'http://lightgala.com:3000/db2/auth/linkedin/callback'
    },
    google: {
	clientID: '237038396856-ooucq2e0qht74kn88d6afgl25anv49gh.apps.googleusercontent.com',
	clientSecret: 'LPHU28P5BWg3UoYofzcBALLP',
	callbackURL: 'http://lightgala.com:3000/db2/auth/google/callback'
    },
    //google openID
    /*google: {
	returnURL: 'http://lighttube.com:3000/db2/auth/google/callback',
	realm: 'http://lighttube.com:3000'
    },*/
    //auth0 service has all the above except has a cost
    auth0: {
	domain: 'lightgala.auth0.com',
	clientID: 'p7bqrHsBGtQSHO154vKL5VCnyxYHZhkF',
	clientSecret: 'uxRMyglXgLegZJNitNN1H7obqLwLVo7xO5U8CaMgCT_iITn_etUcUrvc0kt_J2qN',
	callbackURL: 'http://lightgala.com:3000/db2/auth/auth0/callback'
    },
};

module.exports = ids;
