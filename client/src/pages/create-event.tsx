import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Ticket, 
  Settings,
  Plus,
  Trash2,
  Check,
  Image,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const eventFormSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  shortDescription: z.string().max(500, "Short description must be less than 500 characters").optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  venue: z.string().min(2, "Venue is required"),
  venueAddress: z.string().optional(),
  city: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().min(1, "End time is required"),
  totalCapacity: z.number().min(1, "Capacity must be at least 1"),
  isPublic: z.boolean().default(true),
  ticketTiers: z.array(z.object({
    name: z.string().min(1, "Tier name is required"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be 0 or more"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    maxPerOrder: z.number().min(1).max(100).optional(),
  })).min(1, "At least one ticket tier is required"),
});

type EventFormData = z.infer<typeof eventFormSchema>;

const steps = [
  { id: 1, name: "Event Details", icon: Calendar },
  { id: 2, name: "Tickets", icon: Ticket },
  { id: 3, name: "Settings", icon: Settings },
  { id: 4, name: "Review", icon: Check },
];

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      imageUrl: "",
      venue: "",
      venueAddress: "",
      city: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      totalCapacity: 100,
      isPublic: true,
      ticketTiers: [
        { name: "General Admission", description: "", price: 0, quantity: 100, maxPerOrder: 10 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ticketTiers",
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
      
      return await apiRequest("POST", "/api/events", {
        ...data,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      navigate(`/events/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof EventFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["name", "venue", "startDate", "startTime", "endDate", "endTime", "totalCapacity"];
        break;
      case 2:
        fieldsToValidate = ["ticketTiers"];
        break;
      case 3:
        fieldsToValidate = ["isPublic"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const watchedValues = form.watch();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6" data-testid="button-back">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-2" data-testid="text-create-event-title">
          Create New Event
        </h1>
        <p className="text-muted-foreground">
          Fill in the details to create your event and start selling tickets.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div 
                  className={`
                    h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm
                    ${currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${currentStep >= step.id ? '' : 'text-muted-foreground'}`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  Basic information about your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event name" {...field} data-testid="input-event-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description for event cards (max 500 characters)"
                          className="resize-none"
                          {...field} 
                          data-testid="input-short-description"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of your event"
                          className="min-h-[150px]"
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Image URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input placeholder="https://example.com/image.jpg" {...field} data-testid="input-image-url" />
                          </div>
                          {field.value && (
                            <div className="h-10 w-16 rounded border overflow-hidden bg-muted shrink-0">
                              <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue *</FormLabel>
                        <FormControl>
                          <Input placeholder="Venue name" {...field} data-testid="input-venue" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="venueAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Full venue address"
                          className="resize-none"
                          {...field} 
                          data-testid="input-venue-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="totalCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Capacity *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-capacity"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of attendees for this event
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Ticket Tiers */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Ticket Tiers</CardTitle>
                <CardDescription>
                  Create different pricing tiers for your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-dashed">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Tier {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-tier-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`ticketTiers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tier Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., General Admission, VIP" {...field} data-testid={`input-tier-name-${index}`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ticketTiers.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (₹) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0}
                                  placeholder="0 for free"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid={`input-tier-price-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`ticketTiers.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="What's included in this tier?" {...field} data-testid={`input-tier-description-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`ticketTiers.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid={`input-tier-quantity-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ticketTiers.${index}.maxPerOrder`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Per Order</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1}
                                  max={100}
                                  placeholder="10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                  data-testid={`input-tier-max-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => append({ 
                    name: "", 
                    description: "", 
                    price: 0, 
                    quantity: 50, 
                    maxPerOrder: 10 
                  })}
                  data-testid="button-add-tier"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ticket Tier
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>
                  Configure visibility and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Event</FormLabel>
                        <FormDescription>
                          Allow anyone to discover and purchase tickets for this event
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-public"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send ticket confirmations via WhatsApp (requires setup)
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>

                <div className="rounded-lg border p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send ticket confirmations and updates via email
                      </p>
                    </div>
                    <Switch disabled checked />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Event</CardTitle>
                  <CardDescription>
                    Please review all details before creating your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Info */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Event Details
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{watchedValues.name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Venue:</span>
                        <p className="font-medium">{watchedValues.venue || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium">
                          {watchedValues.startDate} at {watchedValues.startTime}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capacity:</span>
                        <p className="font-medium">{watchedValues.totalCapacity} attendees</p>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Tiers */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Ticket Tiers ({watchedValues.ticketTiers.length})
                    </h4>
                    <div className="space-y-2">
                      {watchedValues.ticketTiers.map((tier, index) => (
                        <div key={index} className="flex justify-between text-sm p-2 rounded bg-muted">
                          <span>{tier.name}</span>
                          <span className="font-medium">
                            ₹{tier.price} x {tier.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </h4>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Visibility:</span>
                      <p className="font-medium">{watchedValues.isPublic ? "Public" : "Private"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-back-step"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext} data-testid="button-next-step">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={createEventMutation.isPending}
                data-testid="button-create-event"
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
