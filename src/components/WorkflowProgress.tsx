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
  autoChecked?: boolean;
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

  // Mock data for demonstration - in real app, this would come from the database
  const [workflowState, setWorkflowState] = useState({
    editingManuallyDone: false,
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

  const isEventCompleted = () => {
    if (!client.event_date) return false;
    return new Date() > new Date(client.event_date);
  };

  const isSelectionCompleted = () => {
    return packageData ? selectedPhotosCount >= packageData.max_edited_photos * 0.6 : false;
  };

  const isEditingCompleted = () => {
    return (packageData && finalPhotosCount === selectedPhotosCount) || workflowState.editingManuallyDone;
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
      autoChecked: true,
      tooltip: 'Auto-checked when package is selected'
    },
    {
      id: 'coverage',
      label: 'Event Coverage Completed',
      icon: Calendar,
      status: isEventCompleted() ? 'done' : 'pending',
      autoChecked: true,
      tooltip: 'Auto-checked when event date has passed'
    },
    {
      id: 'selection',
      label: 'Client Photo Selection',
      icon: Camera,
      status: isSelectionCompleted() ? 'done' : 'pending',
      autoChecked: true,
      tooltip: `Auto-checked when ${packageData?.max_edited_photos ? Math.floor(packageData.max_edited_photos * 0.6) : 60}+ photos selected`
    },
    {
      id: 'editing',
      label: 'Editing & Post-Production',
      icon: Edit,
      status: isEditingCompleted() ? 'done' : 'pending',
      tooltip: 'Auto-checked when final photos match selected photos or manually marked done'
    },
    {
      id: 'deliverables',
      label: 'Deliverables Ready',
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
      status: 'pending', // This would be calculated based on review states
      tooltip: 'Completed when all deliverables are client-approved'
    },
    {
      id: 'delivery',
      label: 'Final Delivery Completed',
      icon: Truck,
      status: workflowState.finalDeliveryDone ? 'done' : 'pending',
      tooltip: 'Manually marked as done by photographer'
    },
    {
      id: 'payment',
      label: 'Payment Closed',
      icon: CreditCard,
      status: isPaymentCompleted() ? 'done' : 'pending',
      autoChecked: true,
      tooltip: 'Auto-checked when payment status is 100%'
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
    if (itemId === 'editing') {
      setWorkflowState(prev => ({
        ...prev,
        editingManuallyDone: !prev.editingManuallyDone
      }));
    } else if (itemId === 'delivery') {
      setWorkflowState(prev => ({
        ...prev,
        finalDeliveryDone: !prev.finalDeliveryDone
      }));
    }
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
                      item.status === 'done' && "text-muted-foreground line-through"
                    )}>
                      {item.label}
                    </span>
                    {item.autoChecked && (
                      <Badge variant="secondary" className="text-xs">Auto</Badge>
                    )}
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
                          subItem.status === 'approved' && "text-muted-foreground line-through"
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
                      
                      {!isShared && subItem.requiresReview && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDeliverableStatus(subItem.id, 'pending-review')}
                            disabled={subItem.status === 'pending-review'}
                          >
                            Submit
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateDeliverableStatus(subItem.id, 'approved')}
                            disabled={subItem.status === 'approved'}
                          >
                            Approve
                          </Button>
                        </div>
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
                    item.status === 'done' && "text-muted-foreground line-through"
                  )}>
                    {item.label}
                  </span>
                  {item.autoChecked && (
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  )}
                </div>
                
                {!isShared && !item.autoChecked && ['editing', 'delivery'].includes(item.id) && (
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