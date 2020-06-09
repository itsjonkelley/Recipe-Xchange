module.exports = function (sequelize, DataTypes) {
    const Recipes = sequelize.define("Recipes", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isAlphanumeric: true
            }
        },
        source: DataTypes.STRING,
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        prepTime: DataTypes.INTEGER,
        cookTime: DataTypes.INTEGER,
        ovenTempF: DataTypes.INTEGER,
        ovenTempC: DataTypes.INTEGER,
        numServings: DataTypes.INTEGER,
        instructions: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category1: DataTypes.INTEGER,
        category2: DataTypes.INTEGER,
        category3: DataTypes.INTEGER,
        public: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        userID: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    Recipes.associate = function(models) {
        Recipes.belongsTo(models.Users, {
          foreignKey: {
            allowNull: false
          }
        });

        Recipes.belongsTo(models.Categories);
      };

    return Recipes;
};
