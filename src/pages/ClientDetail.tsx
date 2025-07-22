import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CreditCard, Upload, Image, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchClient();
    }
  }, [user, id, navigate]);

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
      navigate('/clients');
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
          <Button onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
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
            <Button variant="ghost" onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <Camera className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Client Details</h1>
          </div>
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

        {/* Client Folders */}
        <Card>
          <CardHeader>
            <CardTitle>Project Files</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="references" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="references">References</TabsTrigger>
                <TabsTrigger value="all-photos">All Photos</TabsTrigger>
                <TabsTrigger value="final-photos">Final Photos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="references" className="mt-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Client References</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload sample shots, mood boards, and inspiration images provided by the client
                  </p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload References
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="all-photos" className="mt-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">All Photos</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload raw and unedited photos from the event or photo session
                  </p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="final-photos" className="mt-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Final Photos</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload selected and edited photos ready for client delivery
                  </p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Final Photos
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}