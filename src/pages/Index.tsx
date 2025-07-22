import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Users, Upload, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/clients');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="text-center space-y-8 p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <Camera className="h-16 w-16 text-primary mr-4" />
          <h1 className="text-5xl font-bold text-foreground">
            PhotoClient Pro
          </h1>
        </div>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional client management for photographers. Organize your clients, 
          track payments, and manage project files all in one place.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12">
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <Users className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Client Management</h3>
            <p className="text-sm text-muted-foreground">
              Keep track of all your clients, events, and project details
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <CreditCard className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Payment Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Monitor payment status and due dates for all projects
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <Upload className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">File Organization</h3>
            <p className="text-sm text-muted-foreground">
              Organize references, raw photos, and final deliverables
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
