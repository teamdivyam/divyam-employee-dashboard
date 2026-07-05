/* eslint-disable react/prop-types */
import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { FileCheck2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/components/ui/form';
import { Input } from '@components/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@components/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetOverlay,
    SheetPortal,
} from '@components/components/ui/sheet';
import { Textarea } from '@components/components/ui/textarea';

import {
    CustomerSchema,
    clientCateringPreferences,
    clientDecorPreferences,
    clientLeadSources,
    clientLeadStatuses,
} from '../../../../validator/client.validator';

const defaultValues = {
    name: '',
    phone: '',
    email: '',
    city: '',
    eventDate: '',
    guests: '',
    functions: '',
    eventType: '',
    leadSource: '',
    leadStatus: 'New',
    assignedEmployee: '',
    nextFollowupDate: '',
    venue: '',
    budgetRange: '',
    cateringPreference: '',
    decorPreference: '',
    note: '',
};

const cityOptions = ['Prayagraj', 'Lucknow', 'Kanpur', 'Varanasi', 'Delhi', 'Gurugram'];
const functionOptions = [1, 2, 3, 4, 5];
const serviceOptions = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate Event'];
const budgetOptions = ['Below ₹5 Lakh', '₹5 - ₹10 Lakh', '₹10 - ₹25 Lakh', '₹25 Lakh+'];

export default function ClientLeadSheet({
    open,
    onOpenChange,
    employees,
    onSubmit,
    saving = false,
}) {
    const form = useForm({
        resolver: yupResolver(CustomerSchema),
        defaultValues,
    });

    useEffect(() => {
        if (!open) form.reset(defaultValues);
    }, [open, form]);

    const handleSubmit = (values) => {
        const payload = {
            ...values,
            guests: values.guests === '' ? undefined : Number(values.guests),
            functions: values.functions === '' ? undefined : Number(values.functions),
            followup: values.nextFollowupDate
                ? [{ date: values.nextFollowupDate, note: values.note || null }]
                : undefined,
        };

        delete payload.nextFollowupDate;
        delete payload.note;

        onSubmit(payload);
    };

    const closeSheet = () => {
        form.reset(defaultValues);
        onOpenChange(false);
    };

    const labelCls = 'text-[12px] font-semibold text-foreground';
    const inputCls =
        'crm-input h-9 rounded-md px-3 text-[12px] shadow-none';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetPortal>
                <SheetOverlay className="fixed inset-0 z-40 bg-transparent" />

                <SheetContent
                    side="right"
                    className="fixed right-2 z-50 flex h-[calc(100dvh)] w-[min(470px,calc(100vw-32px))] flex-col gap-0 rounded-xl border border-border bg-card p-0 text-card-foreground shadow-lg sm:max-w-[470px]"
                >
                    <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-border px-5">
                        <h2 className="text-[18px] font-bold tracking-tight text-foreground">
                            Add New Client / Lead
                        </h2>
                    </div>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Client Name <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className={inputCls} placeholder="Enter full name" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Mobile Number <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={inputCls}
                                                    maxLength={10}
                                                    placeholder="Enter mobile number"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Email <span className="font-medium text-muted-foreground">(Optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={inputCls}
                                                    type="email"
                                                    placeholder="Enter email address"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                City <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select city" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {cityOptions.map((city) => (
                                                        <SelectItem key={city} value={city}>
                                                            {city}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="eventDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Event Date <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className={inputCls} type="date" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="guests"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Guest Count <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className={inputCls}
                                                    min={0}
                                                    type="number"
                                                    placeholder="Enter guest count"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="functions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Number of Functions <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? String(field.value) : undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select number" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {functionOptions.map((item) => (
                                                        <SelectItem key={item} value={String(item)}>
                                                            {item}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="eventType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Services Required <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select services" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {serviceOptions.map((service) => (
                                                        <SelectItem key={service} value={service}>
                                                            {service}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="leadSource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Lead Source <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select source" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clientLeadSources.map((source) => (
                                                        <SelectItem key={source} value={source}>
                                                            {source}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="leadStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Status <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clientLeadStatuses.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="assignedEmployee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Assigned Advisor <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select advisor" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {employees.map((employee) => (
                                                        <SelectItem key={employee._id} value={employee._id}>
                                                            {employee.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nextFollowupDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Next Follow-up Date <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className={inputCls} type="date" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="venue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Venue <span className="font-medium text-muted-foreground">(Optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className={inputCls} placeholder="Enter venue name" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="budgetRange"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Budget Range{' '}
                                                <span className="font-medium text-muted-foreground">(Optional)</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select range" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {budgetOptions.map((budget) => (
                                                        <SelectItem key={budget} value={budget}>
                                                            {budget}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cateringPreference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Catering Preference{' '}
                                                <span className="font-medium text-muted-foreground">(Optional)</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select preference" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clientCateringPreferences.map((preference) => (
                                                        <SelectItem key={preference} value={preference}>
                                                            {preference}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="decorPreference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={labelCls}>
                                                Decor Preference{' '}
                                                <span className="font-medium text-muted-foreground">(Optional)</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className={inputCls}>
                                                        <SelectValue placeholder="Select preference" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clientDecorPreferences.map((preference) => (
                                                        <SelectItem key={preference} value={preference}>
                                                            {preference}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel className={labelCls}>
                                                Notes <span className="font-medium text-muted-foreground">(Optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    className="crm-input min-h-[64px] resize-none rounded-md px-3 py-2 text-[12px] shadow-none"
                                                    placeholder="Enter notes or special requirements"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid shrink-0 grid-cols-2 gap-4 border-t border-border bg-card px-5 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="crm-outline-button h-10 rounded-md text-[13px] font-semibold"
                                    onClick={closeSheet}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="crm-primary-button h-10 gap-2 rounded-md text-[13px] font-semibold shadow-none"
                                >
                                    <FileCheck2 className="h-4 w-4" />
                                    Save Client
                                </Button>
                            </div>
                        </form>
                    </Form>
                </SheetContent>
            </SheetPortal>
        </Sheet>
    );
}
