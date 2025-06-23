'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { LoadingSwap } from '@/components/LoadingSwap';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OrganizationUserSettingsTable } from '@/drizzle/schema';
import { RatingIcons } from '@/features/jobListingApplications/components/RatingIcons';
import { RATING_OPTIONS } from '@/features/jobListingApplications/data/constants';

import { updateOrganizationUserSettings } from '../actions/organizationUserSettings';
import { organizationUserSettingsSchema } from '../actions/schemas';

const ANY_VALUE = 'any';

export function NotificationsForm({
  notificationSettings,
}: {
  notificationSettings?: Pick<
    typeof OrganizationUserSettingsTable.$inferSelect,
    'newApplicationEmailNotifications' | 'minimumRating'
  >;
}) {
  const form = useForm({
    resolver: zodResolver(organizationUserSettingsSchema),
    defaultValues: notificationSettings ?? {
      minimumRating: null,
      newApplicationEmailNotifications: false,
    },
  });

  async function onSubmit(data: z.infer<typeof organizationUserSettingsSchema>) {
    const result = await updateOrganizationUserSettings(data);

    if (result.error) {
      toast.error(result.message);
    } else {
      toast.success(result.message);
    }
  }

  const newApplicationEmailNotifications = form.watch('newApplicationEmailNotifications');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="border rounded-lg p-4 shadow-sm space-y-6">
          <FormField
            name="newApplicationEmailNotifications"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Daily Email Notifications</FormLabel>
                    <FormDescription>
                      Receive summary emails of all new job listing applications
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          {newApplicationEmailNotifications && (
            <FormField
              name="minimumRating"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Rating</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : ANY_VALUE}
                    onValueChange={(val) =>
                      field.onChange(val === ANY_VALUE ? null : parseInt(val))
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue asChild>
                          {field.value === null ? (
                            <span>Any Rating</span>
                          ) : (
                            <RatingIcons className="text-inherit" rating={field.value} />
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ANY_VALUE}>Any Rating</SelectItem>
                      {RATING_OPTIONS.filter((r) => r !== null).map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          <RatingIcons className="text-inherit" rating={rating} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only receive notifications for candidates that meet or exceed this rating.
                    Candidates 3-5 stars should meet all job requirements and are likely a good fit
                    for the role.
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            Save Notification Settings
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
