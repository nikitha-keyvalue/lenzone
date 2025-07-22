import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Camera, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FolderGrid from '@/components/FolderGrid';
import FolderView from '@/components/FolderView';
import WorkflowProgress from '@/components/WorkflowProgress';

interface Client {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  due_date: string | null;
  payment_status: string;
  location: string | null;
  contact: string | null;
  created_at: string;
  package_id: string | null;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isShared = searchParams.get('shared') === 'true';
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'folders' | 'references' | 'all-photos' | 'final-photos'>('folders');

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client details",
        variant: "destructive"
      });
      // Only navigate to clients if not a shared link
      if (!isShared) {
        navigate('/clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      case 'unpaid': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/client/${id}?shared=true`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleFolderClick = (folderType: string) => {
    navigate(`/client/${id}/${folderType}${isShared ? '?shared=true' : ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Client not found</h2>
          {!isShared && (
            <Button onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isShared && (
              <>
                <Button variant="ghost" onClick={() => navigate('/clients')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-border"></div>
              </>
            )}
            <Camera className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Client Details</h1>
          </div>
          {!isShared && (
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Client Info Panel */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{client.name}</CardTitle>
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">CONTACT</h3>
                <p className="text-base">{client.contact || 'Not provided'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">LOCATION</h3>
                <p className="text-base">{client.location || 'Not provided'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">PAYMENT STATUS</h3>
                <Badge variant={getPaymentBadgeVariant(client.payment_status)} className="text-sm">
                  {client.payment_status}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">EVENT DATE</h3>
                <p className="text-base">{formatDate(client.event_date)}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">DUE DATE</h3>
                <p className="text-base">{formatDate(client.due_date)}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">PROJECT START</h3>
                <p className="text-base">{formatDate(client.created_at)}</p>
              </div>
            </div>

            {client.description && (
              <div className="mt-6">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">DESCRIPTION</h3>
                <p className="text-base leading-relaxed">{client.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Progress */}
        <div className="mb-6">
          <WorkflowProgress client={client} isShared={isShared} />
        </div>

        {/* Project Files */}
        <Card>
          <CardHeader>
            <CardTitle>Project Files</CardTitle>
          </CardHeader>
          <CardContent>
            <FolderGrid onFolderClick={handleFolderClick} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}