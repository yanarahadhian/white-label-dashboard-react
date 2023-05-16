module.exports = {
    apps : [{
          name: "white_label_dashboard",
          script: "./white_label_dashboard.js",
          watch: true,
          env_devdo: {
              "PORT": 3008,
              "NODE_ENV": "mode_test",
              "PLATFORM": "DO",
          },
          env_productiondo: {
              "PORT": 3008,
              "NODE_ENV": "mode_production",
              "PLATFORM": "DO",
          },
          env_devaws: {
              "PORT": 3008,
              "NODE_ENV": "mode_test",
              "PLATFORM": "AWS",
          },
          env_productionaws: {
              "PORT": 3008,
              "NODE_ENV": "mode_production",
              "PLATFORM": "AWS",
          }
        }]
  }