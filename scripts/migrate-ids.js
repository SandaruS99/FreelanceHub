const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sudarshana1999:Sadaruwan9@cluster0.qjh5xt1.mongodb.net/freelancehub?retryWrites=true&w=majority';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const CounterSchema = new mongoose.Schema({
            id: { type: String, required: true, unique: true },
            seq: { type: Number, default: 0 },
        });
        const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

        const UserSchema = new mongoose.Schema({
            name: String,
            role: String,
            userId: String
        }, { timestamps: true });
        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const users = await User.find({
            role: 'freelancer',
            userId: { $exists: false }
        });

        console.log(`Found ${users.length} freelancers to migrate.`);

        for (const user of users) {
            const counter = await Counter.findOneAndUpdate(
                { id: 'userId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            const seq = counter.seq + 1000;
            const userId = `FH-${seq}`;

            await User.updateOne({ _id: user._id }, { $set: { userId } });
            console.log(`Migrated user ${user.name} to ${userId}`);
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

run();
