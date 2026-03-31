export interface ProjectCategory {
    id: string;
    label: string;
    group: 'Design & Creativity' | 'Video & Animation' | 'Development & Tech' | 'Marketing & Writing' | 'Other';
}

export const PROJECT_CATEGORIES: ProjectCategory[] = [
    // Design & Creativity
    { id: 'ui-ux', label: 'UI/UX Design', group: 'Design & Creativity' },
    { id: 'graphic-design', label: 'Graphic Design', group: 'Design & Creativity' },
    { id: 'social-media', label: 'Social Media Post Design', group: 'Design & Creativity' },
    { id: 'branding', label: 'Logo & Branding', group: 'Design & Creativity' },
    { id: 'illustration', label: 'Illustration', group: 'Design & Creativity' },

    // Video & Animation
    { id: 'video-editing', label: 'Video Editing', group: 'Video & Animation' },
    { id: 'video-ads', label: 'Video Ads', group: 'Video & Animation' },
    { id: 'motion-graphics', label: 'Motion Graphics', group: 'Video & Animation' },
    { id: 'animation', label: '2D/3D Animation', group: 'Video & Animation' },

    // Development & Tech
    { id: 'web-dev', label: 'Web Development', group: 'Development & Tech' },
    { id: 'mobile-dev', label: 'Mobile App Development', group: 'Development & Tech' },
    { id: 'software-dev', label: 'Software Development', group: 'Development & Tech' },
    { id: 'ecommerce', label: 'E-Commerce Development', group: 'Development & Tech' },

    // Marketing & Writing
    { id: 'digital-marketing', label: 'Digital Marketing', group: 'Marketing & Writing' },
    { id: 'seo', label: 'SEO Services', group: 'Marketing & Writing' },
    { id: 'copywriting', label: 'Copywriting', group: 'Marketing & Writing' },
    { id: 'content', label: 'Content Creation', group: 'Marketing & Writing' },

    // Other
    { id: 'consulting', label: 'Consulting', group: 'Other' },
    { id: 'other', label: 'Other', group: 'Other' },
];

export const CATEGORY_GROUPS = [
    'Design & Creativity',
    'Video & Animation',
    'Development & Tech',
    'Marketing & Writing',
    'Other'
];
