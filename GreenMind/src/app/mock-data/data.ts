export const MOCK: any = {
  farms: [
    {
      id: 'farm-1',
      name: 'مزرعة الشروق',
      ownerUserId: 'user-1',
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: 'farm-2',
      name: 'مزرعة الغدير',
      ownerUserId: 'user-2',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      isActive: false,
    },
  ],

  crops: [
    { id: 'crop-1', name: 'القمح' },
    { id: 'crop-2', name: 'الذرة' },
    { id: 'crop-3', name: 'البرتقال' },
  ],

  destinations: [
    { id: 'dest-1', name: 'السوق المحلي' },
    { id: 'dest-2', name: 'الإمارات' },
    { id: 'dest-3', name: 'السعودية' },
  ],

  exportPlans: [
    {
      id: 'plan-1',
      name: 'خطة التصدير الأولى',
      cropId: 'crop-1',
      destinationId: 'dest-2',
      plantingDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      expectedHarvestDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      expectedExportDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
      status: 'Draft',
    },
    {
      id: '1',
      name: 'خطة التصدير الأساسية',
      cropId: 'crop-2',
      destinationId: 'dest-1',
      plantingDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      expectedHarvestDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
      expectedExportDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
      status: 'Active',
    },
  ],

  users: [
    { id: 'user-1', fullName: 'أحمد علي' },
    { id: 'user-2', fullName: 'منى حسن' },
  ],

  // Numeric-id farms and extra structures to satisfy routes like /admin/farms/1 and /farm
  farmsById: {
    '1': {
      id: '1',
      name: 'مزرعة النور',
      ownerUserId: 'user-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
      isActive: true,
      areaHectares: 12.4,
      location: 'الريف الأوسط',
    },
  },

  // Tasks and soil measurements linked to export plan id '1'
  tasks: [
    {
      id: 'task-1',
      planId: '1',
      title: 'إعداد الأرض',
      description: 'تحضير التربة وزراعتها',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      priority: 'High',
      status: 'Open',
    },
    {
      id: 'task-2',
      planId: '1',
      title: 'رعاية المحصول',
      description: 'تسميد ومتابعة الآفات',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      priority: 'Medium',
      status: 'InProgress',
    },
  ],

  soilMeasurements: [
    {
      id: 'soil-1',
      planId: '1',
      measuredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      ph: 6.8,
      moisture: 23.4,
      ec: 0.45,
    },
  ],

  statistics: {
    totalFarms: 24,
    activeFarms: 18,
    inactiveFarms: 6,
    totalExportPlans: 37,
    plansByCrop: [
      { cropName: 'القمح', count: 12 },
      { cropName: 'الذرة', count: 9 },
      { cropName: 'البرتقال', count: 16 },
    ],
    plansByDestination: [
      { destinationName: 'السوق المحلي', count: 10 },
      { destinationName: 'الإمارات', count: 14 },
    ],
  },
};

export default MOCK;
