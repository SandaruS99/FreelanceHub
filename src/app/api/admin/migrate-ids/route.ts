import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Counter from '@/models/Counter';

export async function GET() {
    try {
        await dbConnect();

        let updatedClients = 0;
        let updatedProjects = 0;

        // 1. Migrate Clients
        const clientsWithoutNumber = await Client.find({ clientNumber: { $exists: false } });
        for (const client of clientsWithoutNumber) {
            const counter = await Counter.findOneAndUpdate(
                { id: 'clientNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const seq = (counter?.seq || 0) + 1000;
            client.clientNumber = `CLI-${seq}`;
            await client.save();
            updatedClients++;
        }

        // 2. Migrate Projects
        const projectsWithoutNumber = await Project.find({ projectNumber: { $exists: false } });
        for (const project of projectsWithoutNumber) {
            const counter = await Counter.findOneAndUpdate(
                { id: 'projectNumber' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            const seq = (counter?.seq || 0) + 1000;
            project.projectNumber = `PRJ-${seq}`;
            await project.save();
            updatedProjects++;
        }

        return NextResponse.json({
            success: true,
            message: `Migrated ${updatedClients} clients and ${updatedProjects} projects.`,
            updatedClients,
            updatedProjects
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
