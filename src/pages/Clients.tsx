import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, LogOut, Camera, Eye, Edit, Trash2, CalendarIcon, ChevronDown, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  due_date: string | null;
  payment_status: string;
  location: string | null;
  contact: string | null;
  event_type: string | null;
  package_id: string | null;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  max_edited_photos: number;
  includes: string[];
  deliverables: string[];
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    paymentStatus: 'all',
    eventType: 'all',
    packageId: 'all',
    location: '',
    eventDateFrom: null as Date | null,
    eventDateTo: null as Date | null,
    dueDateFrom: null as Date | null,
    dueDateTo: null as Date | null,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: null as Date | null,
    due_date: null as Date | null,
    payment_status: 'unpaid' as const,
    location: '',
    contact: '',
    event_type: '',
    package_id: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchClients();
    fetchPackages();
  }, [user, navigate]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filters]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          packages (
            id,
            name,
            price,
            max_edited_photos
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch packages",
        variant: "destructive"
      });
    }
  };

  const categorizeClients = (clientsList: Client[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming: Client[] = [];
    const inProgress: Client[] = [];
    const completed: Client[] = [];

    clientsList.forEach(client => {
      if (!client.event_date) {
        // Clients without event dates go to upcoming by default
        upcoming.push(client);
        return;
      }

      const eventDate = new Date(client.event_date);
      eventDate.setHours(0, 0, 0, 0);
      
      const dueDate = client.due_date ? new Date(client.due_date) : null;
      if (dueDate) dueDate.setHours(0, 0, 0, 0);

      if (eventDate > today) {
        // Future event dates
        upcoming.push(client);
      } else if (eventDate.getTime() === today.getTime()) {
        // Today's events
        inProgress.push(client);
      } else {
        // Past event dates
        if (dueDate && dueDate >= today) {
          // Event happened but work is still due
          inProgress.push(client);
        } else {
          // Event happened and work is complete or overdue
          completed.push(client);
        }
      }
    });

    return { upcoming, inProgress, completed };
  };

  const filterClients = () => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(client => client.payment_status === filters.paymentStatus);
    }

    // Event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(client => client.event_type === filters.eventType);
    }

    // Package filter
    if (filters.packageId !== 'all') {
      filtered = filtered.filter(client => client.package_id === filters.packageId);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(client => 
        client.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Event date range filter
    if (filters.eventDateFrom || filters.eventDateTo) {
      filtered = filtered.filter(client => {
        if (!client.event_date) return false;
        const eventDate = new Date(client.event_date);
        const fromDate = filters.eventDateFrom;
        const toDate = filters.eventDateTo;
        
        if (fromDate && eventDate < fromDate) return false;
        if (toDate && eventDate > toDate) return false;
        return true;
      });
    }

    // Due date range filter
    if (filters.dueDateFrom || filters.dueDateTo) {
      filtered = filtered.filter(client => {
        if (!client.due_date) return false;
        const dueDate = new Date(client.due_date);
        const fromDate = filters.dueDateFrom;
        const toDate = filters.dueDateTo;
        
        if (fromDate && dueDate < fromDate) return false;
        if (toDate && dueDate > toDate) return false;
        return true;
      });
    }

    setFilteredClients(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            ...formData,
            event_date: formData.event_date ? format(formData.event_date, 'yyyy-MM-dd') : null,
            due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
            description: formData.description || null,
            location: formData.location || null,
            contact: formData.contact || null,
            event_type: formData.event_type || null,
            package_id: formData.package_id || null
          })
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client updated successfully"
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([{
            ...formData,
            photographer_id: user!.id,
            event_date: formData.event_date ? format(formData.event_date, 'yyyy-MM-dd') : null,
            due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
            description: formData.description || null,
            location: formData.location || null,
            contact: formData.contact || null,
            event_type: formData.event_type || null,
            package_id: formData.package_id || null
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Client added successfully"
        });
      }

      handleCloseDialog();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: editingClient ? "Failed to update client" : "Failed to add client",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      description: client.description || '',
      event_date: client.event_date ? new Date(client.event_date) : null,
      due_date: client.due_date ? new Date(client.due_date) : null,
      payment_status: client.payment_status as any,
      location: client.location || '',
      contact: client.contact || '',
      event_type: client.event_type || '',
      package_id: client.package_id || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', deletingClient.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully"
      });

      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFilters({
      paymentStatus: 'all',
      eventType: 'all',
      packageId: 'all',
      location: '',
      eventDateFrom: null,
      eventDateTo: null,
      dueDateFrom: null,
      dueDateTo: null,
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      paymentStatus: 'all',
      eventType: 'all',
      packageId: 'all',
      location: '',
      eventDateFrom: null,
      eventDateTo: null,
      dueDateFrom: null,
      dueDateTo: null,
    });
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading clients...</p>
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
            <Camera className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">PhotoClient Pro</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Controls Section */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              {/* Enhanced Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search clients by name, contact, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background/80 transition-all duration-200 hover:border-border hover:bg-background/70"
                />
              </div>
            </div>

            {/* Enhanced Add Client Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingClient(null);
                    setDialogOpen(true);
                  }}
                  className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  Add New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact</Label>
                      <Input
                        id="contact"
                        value={formData.contact}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        placeholder="Email or phone"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Project details..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_type">Event Type</Label>
                      <Select 
                        value={formData.event_type} 
                        onValueChange={(value) => setFormData({...formData, event_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Event Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.event_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.event_date ? format(formData.event_date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.event_date || undefined}
                            onSelect={(date) => setFormData({...formData, event_date: date || null})}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.due_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.due_date ? format(formData.due_date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.due_date || undefined}
                            onSelect={(date) => setFormData({...formData, due_date: date || null})}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package_id">Photography Package</Label>
                      <Select 
                        value={formData.package_id} 
                        onValueChange={(value) => setFormData({...formData, package_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - ₹{pkg.price.toLocaleString()} ({pkg.max_edited_photos} photos)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Event location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_status">Payment Status</Label>
                      <Select 
                        value={formData.payment_status} 
                        onValueChange={(value) => setFormData({...formData, payment_status: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingClient ? 'Update Client' : 'Add Client'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Collapsible Comprehensive Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <span className="text-lg font-semibold">Advanced Filters</span>
                    {Object.values(filters).some(value => 
                      value !== 'all' && value !== '' && value !== null
                    ) && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    filtersOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                <div className="px-6 pb-6 space-y-4 border-t border-border/50">
                  <div className="flex justify-end pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Clear All
                    </Button>
                  </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Payment Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Status</Label>
                <Select 
                  value={filters.paymentStatus} 
                  onValueChange={(value) => setFilters({...filters, paymentStatus: value})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Event Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Event Type</Label>
                <Select 
                  value={filters.eventType} 
                  onValueChange={(value) => setFilters({...filters, eventType: value})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Package Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Package</Label>
                <Select 
                  value={filters.packageId} 
                  onValueChange={(value) => setFilters({...filters, packageId: value})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <Input
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="h-10"
                />
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* Event Date Range */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Event Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !filters.eventDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.eventDateFrom ? format(filters.eventDateFrom, "MMM dd, yyyy") : <span>From date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.eventDateFrom || undefined}
                          onSelect={(date) => setFilters({...filters, eventDateFrom: date || null})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !filters.eventDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.eventDateTo ? format(filters.eventDateTo, "MMM dd, yyyy") : <span>To date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.eventDateTo || undefined}
                          onSelect={(date) => setFilters({...filters, eventDateTo: date || null})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Due Date Range */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Due Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !filters.dueDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dueDateFrom ? format(filters.dueDateFrom, "MMM dd, yyyy") : <span>From date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dueDateFrom || undefined}
                          onSelect={(date) => setFilters({...filters, dueDateFrom: date || null})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !filters.dueDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dueDateTo ? format(filters.dueDateTo, "MMM dd, yyyy") : <span>To date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dueDateTo || undefined}
                          onSelect={(date) => setFilters({...filters, dueDateTo: date || null})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* Clients Sections */}
        {(() => {
          const { upcoming, inProgress, completed } = categorizeClients(filteredClients);
          
          const renderClientSection = (sectionClients: Client[], title: string, badgeVariant: "default" | "secondary" | "destructive") => (
            <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  {title}
                  <Badge variant={badgeVariant} className="ml-auto px-3 py-1 font-medium">
                    {sectionClients.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 bg-muted/30">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Event Type</TableHead>
                        <TableHead className="font-semibold">Event Date</TableHead>
                        <TableHead className="font-semibold">Due Date</TableHead>
                        <TableHead className="font-semibold">Payment</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="w-32 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sectionClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </div>
                              No clients in this section.
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sectionClients.map((client) => (
                          <TableRow 
                            key={client.id} 
                            className="cursor-pointer hover:bg-muted/30 transition-colors duration-200 border-border/30"
                            onClick={() => navigate(`/client/${client.id}`)}
                          >
                            <TableCell className="font-medium py-4">{client.name}</TableCell>
                            <TableCell className="py-4">{client.contact || '-'}</TableCell>
                            <TableCell className="capitalize py-4">
                              <Badge variant="outline" className="bg-background/50">
                                {client.event_type || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">{formatDate(client.event_date)}</TableCell>
                            <TableCell className="py-4">{formatDate(client.due_date)}</TableCell>
                            <TableCell className="py-4">
                              <Badge variant={getPaymentBadgeVariant(client.payment_status)} className="font-medium">
                                {client.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">{client.location || '-'}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()} className="py-4">
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/client/${client.id}`)}
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEdit(client)}
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteClick(client)}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );

          if (filteredClients.length === 0) {
            return (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {clients.length === 0 ? "No clients yet" : "No matching clients"}
                      </h3>
                      <p className="text-muted-foreground">
                        {clients.length === 0 ? "Add your first client to get started!" : "Try adjusting your search or filter criteria."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <>
              {upcoming.length > 0 && renderClientSection(upcoming, "Upcoming Events", "default")}
              {inProgress.length > 0 && renderClientSection(inProgress, "Shoot in Progress", "secondary")}
              {completed.length > 0 && renderClientSection(completed, "Completed", "destructive")}
            </>
          );
        })()}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingClient?.name}</strong>? 
              This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}