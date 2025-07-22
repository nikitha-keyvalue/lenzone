import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Package, Calendar, Camera, Edit, Gift, MessageSquare, Truck, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  package_id: string | null;
  event_date: string | null;
  payment_status: string;
}

interface Package {
  id: string;
  name: string;
  deliverables: string[];
  max_edited_photos: number;
}

interface WorkflowProgressProps {
  client: Client;
  isShared?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'in-progress' | 'done';
  tooltip?: string;
  subItems?: SubItem[];
}

interface SubItem {
  id: string;
  label: string;
  status: 'not-started' | 'pending-review' | 'revisions-needed' | 'approved';
  requiresReview?: boolean;
}

export default function WorkflowProgress({ client, isShared = false }: WorkflowProgressProps) {
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [deliverablesSectionOpen, setDeliverablesSectionOpen] = useState(false);
  const [selectedPhotosCount, setSelectedPhotosCount] = useState(0);
  const [finalPhotosCount, setFinalPhotosCount] = useState(0);
  const { toast } = useToast();

  // Track manual completion status for all workflow items
  const [workflowState, setWorkflowState] = useState({
    coverageCompleted: false,
    selectionCompleted: false,
    editingManuallyDone: false,
    reviewCompleted: false,
    finalDeliveryDone: false,
  });

  const [deliverableItems, setDeliverableItems] = useState<Record<string, 'not-started' | 'pending-review' | 'revisions-needed' | 'approved'>>({});

  useEffect(() => {
    // Fetch package data and photo counts
    // This is mock implementation - replace with actual API calls
    if (client.package_id) {
      setPackageData({
        id: client.package_id,
        name: 'Premium Wedding Package',
        deliverables: [
          'Album Design Ready',
          'Laminated Frame(s) Ready',
          'Picstory Created (30s)',
          'Reel Videos Edited (2 x 30s)',
          'Highlight Video Ready (3–5 min)',
          'Full Video Ready',
          'Calendar Designed',
          'Raw Files Shared'
        ],
        max_edited_photos: 100
      });
    }
    
    // Mock photo counts - replace with actual counts
    setSelectedPhotosCount(85);
    setFinalPhotosCount(85);
    
    // Fetch deliverable status from database
    fetchDeliverableStatus();
    
    // Set up real-time subscription for deliverable updates
    const channel = supabase
      .channel('workflow-deliverable-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliverable_status',
          filter: `client_id=eq.${client.id}`
        },
        () => {
          fetchDeliverableStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client]);

  const fetchDeliverableStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('deliverable_status')
        .select('*')
        .eq('client_id', client.id);

      if (error) throw error;
      
      const statusMap: Record<string, 'not-started' | 'pending-review' | 'revisions-needed' | 'approved'> = {};
      data?.forEach(item => {
        statusMap[item.deliverable_name] = item.status as 'not-started' | 'pending-review' | 'revisions-needed' | 'approved';
      });
      
      setDeliverableItems(statusMap);
    } catch (error) {
      console.error('Error fetching deliverable status:', error);
    }
  };

  const getCheckboxIcon = (status: string) => {
    switch (status) {
      case 'done': return '✅';
      case 'in-progress': return '◔';
      default: return '☐';
    }
  };

  const getSubItemIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending-review': return '🕒';
      case 'revisions-needed': return '✏️';
      default: return '☐';
    }
  };

  const areDeliverablesReady = () => {
    if (!packageData) return false;
    return packageData.deliverables.every(item => 
      deliverableItems[item] === 'approved'
    );
  };

  const isPaymentCompleted = () => {
    return client.payment_status === 'paid';
  };

  const checklistItems: ChecklistItem[] = [
    {
      id: 'package',
      label: 'Package Confirmation',
      icon: Package,
      status: client.package_id ? 'done' : 'pending',
      tooltip: 'Package selection status'
    },
    {
      id: 'coverage',
      label: 'Event Coverage Completed',
      icon: Calendar,
      status: workflowState.coverageCompleted ? 'done' : 'pending',
      tooltip: 'Mark as done when event coverage is completed'
    },
    {
      id: 'selection',
      label: 'Client Photo Selection',
      icon: Camera,
      status: workflowState.selectionCompleted ? 'done' : 'pending',
      tooltip: 'Mark as done when client photo selection is completed'
    },
    {
      id: 'editing',
      label: 'Editing & Post-Production',
      icon: Edit,
      status: workflowState.editingManuallyDone ? 'done' : 'pending',
      tooltip: 'Mark as done when editing and post-production is completed'
    },
    {
      id: 'deliverables',
      label: 'Final Deliverables Ready',
      icon: Gift,
      status: areDeliverablesReady() ? 'done' : 'pending',
      tooltip: 'Completed when all sub-items are approved',
      subItems: packageData?.deliverables.map(item => ({
        id: item,
        label: item,
        status: deliverableItems[item] || 'not-started',
        requiresReview: true
      })) || []
    },
    {
      id: 'review',
      label: 'Client Review & Feedback',
      icon: MessageSquare,
      status: workflowState.reviewCompleted ? 'done' : 'pending',
      tooltip: 'Mark as done when client review and feedback is completed'
    },
    {
      id: 'delivery',
      label: 'Final Delivery Completed',
      icon: Truck,
      status: workflowState.finalDeliveryDone ? 'done' : 'pending',
      tooltip: 'Mark as done when final delivery is completed'
    },
    {
      id: 'payment',
      label: 'Payment Closed',
      icon: CreditCard,
      status: isPaymentCompleted() ? 'done' : 'pending',
      tooltip: 'Payment completion status'
    }
  ];

  const completedItems = checklistItems.filter(item => item.status === 'done').length;
  const progressPercentage = (completedItems / checklistItems.length) * 100;

  const updateDeliverableStatus = async (itemId: string, newStatus: 'not-started' | 'pending-review' | 'revisions-needed' | 'approved') => {
    try {
      const { error } = await supabase
        .from('deliverable_status')
        .upsert({
          client_id: client.id,
          deliverable_name: itemId,
          status: newStatus
        });

      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: `Deliverable marked as ${newStatus.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating deliverable status:', error);
      toast({
        title: "Error",
        description: "Failed to update deliverable status",
        variant: "destructive"
      });
    }
  };

  const toggleManualItem = (itemId: string) => {
    setWorkflowState(prev => {
      switch (itemId) {
        case 'coverage':
          return { ...prev, coverageCompleted: !prev.coverageCompleted };
        case 'selection':
          return { ...prev, selectionCompleted: !prev.selectionCompleted };
        case 'editing':
          return { ...prev, editingManuallyDone: !prev.editingManuallyDone };
        case 'review':
          return { ...prev, reviewCompleted: !prev.reviewCompleted };
        case 'delivery':
          return { ...prev, finalDeliveryDone: !prev.finalDeliveryDone };
        default:
          return prev;
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Wedding Workflow Progress
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {completedItems} of {checklistItems.length} completed
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {checklistItems.map((item) => (
          <div key={item.id} className="space-y-2">
            {item.id === 'deliverables' ? (
              <Collapsible 
                open={deliverablesSectionOpen} 
                onOpenChange={setDeliverablesSectionOpen}
              >
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCheckboxIcon(item.status)}</span>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "font-medium",
                      item.status === 'done' && "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {deliverablesSectionOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="space-y-2 ml-6">
                  {item.subItems
                    ?.filter(subItem => !isShared || subItem.status === 'pending-review')
                    .map((subItem) => (
                    <div key={subItem.id} className="flex items-center justify-between p-2 rounded border bg-background">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{getSubItemIcon(subItem.status)}</span>
                        <span className={cn(
                          "text-sm",
                          subItem.status === 'approved' && "text-muted-foreground"
                        )}>
                          {subItem.label}
                        </span>
                        <Badge 
                          variant={
                            subItem.status === 'approved' ? 'default' :
                            subItem.status === 'pending-review' ? 'secondary' :
                            subItem.status === 'revisions-needed' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {subItem.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      {!isShared && subItem.requiresReview && subItem.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDeliverableStatus(subItem.id, 'pending-review')}
                          disabled={subItem.status === 'pending-review'}
                        >
                          Submit
                        </Button>
                      )}
                      
                      {isShared && subItem.status === 'pending-review' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateDeliverableStatus(subItem.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCheckboxIcon(item.status)}</span>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className={cn(
                    "font-medium",
                    item.status === 'done' && "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                
                {!isShared && !['package', 'payment', 'deliverables'].includes(item.id) && (
                  <Button
                    size="sm"
                    variant={item.status === 'done' ? 'default' : 'outline'}
                    onClick={() => toggleManualItem(item.id)}
                  >
                    {item.status === 'done' ? 'Completed' : 'Mark Done'}
                  </Button>
                )}
              </div>
            )}
            
            {item.tooltip && (
              <p className="text-xs text-muted-foreground ml-10">{item.tooltip}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}