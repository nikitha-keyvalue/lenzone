import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface ClientDeliverablesProps {
  client: Client;
}

interface DeliverableItem {
  id: string;
  label: string;
  status: 'not-started' | 'pending-review' | 'revisions-needed' | 'approved';
}

export default function ClientDeliverables({ client }: ClientDeliverablesProps) {
  const [packageData, setPackageData] = useState<Package | null>(null);
  
  // Mock data for demonstration - in real app, this would come from the database
  const [deliverableItems, setDeliverableItems] = useState<Record<string, 'not-started' | 'pending-review' | 'revisions-needed' | 'approved'>>({});

  useEffect(() => {
    // Fetch package data and deliverable status
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
        ]
      });
      
      // Mock some submitted deliverables
      setDeliverableItems({
        'Album Design Ready': 'pending-review',
        'Picstory Created (30s)': 'pending-review',
        'Highlight Video Ready (3–5 min)': 'approved'
      });
    }
  }, [client]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending-review': return '🕒';
      case 'revisions-needed': return '✏️';
      default: return '☐';
    }
  };

  const updateDeliverableStatus = (itemId: string, newStatus: 'approved') => {
    setDeliverableItems(prev => ({
      ...prev,
      [itemId]: newStatus
    }));
  };

  // Only show deliverables that have been submitted by photographer (pending-review status or approved)
  const submittedDeliverables: DeliverableItem[] = packageData?.deliverables
    .filter(item => deliverableItems[item] === 'pending-review' || deliverableItems[item] === 'approved')
    .map(item => ({
      id: item,
      label: item,
      status: deliverableItems[item]
    })) || [];

  if (submittedDeliverables.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Deliverables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No deliverables have been submitted yet.</p>
            <p className="text-sm">Your photographer will submit items for your review as they become ready.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const approvedCount = submittedDeliverables.filter(item => item.status === 'approved').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Deliverables
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {approvedCount} of {submittedDeliverables.length} approved
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {submittedDeliverables.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getStatusIcon(item.status)}</span>
              <span className={cn(
                "font-medium",
                item.status === 'approved' && "text-muted-foreground line-through"
              )}>
                {item.label}
              </span>
              <Badge 
                variant={
                  item.status === 'approved' ? 'default' :
                  item.status === 'pending-review' ? 'secondary' :
                  'destructive'
                }
                className="text-xs"
              >
                {item.status === 'pending-review' ? 'Ready for Review' : 
                 item.status === 'approved' ? 'Approved' : 'Needs Revision'}
              </Badge>
            </div>
            
            {item.status === 'pending-review' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => updateDeliverableStatus(item.id, 'approved')}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            )}
          </div>
        ))}
        
        {submittedDeliverables.some(item => item.status === 'pending-review') && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Review Instructions:</strong> Please review each deliverable carefully. 
              Once you approve an item, it will be marked as completed for your photographer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}