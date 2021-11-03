import Sequelize from 'sequelize';

import { 
    connectDB as connectSQLDB
} from '../db/index.js';
var sequelize;
export class SQTeacher extends Sequelize.Model {}

export async function connectDB() {
    if (sequelize) return;
    sequelize = await connectSQLDB();
    SQTeacher.init({
        teacherkey: {type: Sequelize.DataTypes.STRING,
            primaryKey: true, unique: true },
        
        firstName: Sequelize.DataTypes.STRING, 
        lastName: Sequelize.DataTypes.STRING, 
        email: Sequelize.DataTypes.STRING, 
        phone: Sequelize.DataTypes.STRING, 
        school: Sequelize.DataTypes.TEXT, 
    }, {
        sequelize,
        modelName: 'SQTeacher'
    });
    await SQTeacher.sync();
}
