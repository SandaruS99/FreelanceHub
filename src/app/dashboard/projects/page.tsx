import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import ProjectsPageClient from '@/components/ProjectsPageClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/auth/login');
    }

    const userId = (session.user as { id: string }).id;

    await dbConnect();

    const projects = await Project.find({ freelancerId: userId })
        .populate('clientId', 'name company')
        .sort({ createdAt: -1 })
        .lean();

    const serializedProjects = JSON.parse(JSON.stringify(projects));

    return <ProjectsPageClient initialProjects={serializedProjects} />;
}
