'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

import { LoadingSwap } from '@/components/LoadingSwap';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import { getAiJobListingSearchResults } from '../actions/actions';
import { jobListingAiSearchSchema } from '../actions/schemas';

export function JobListingAISearchForm() {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(jobListingAiSearchSchema),
    defaultValues: {
      query: '',
    },
  });

  async function onSubmit(data: z.infer<typeof jobListingAiSearchSchema>) {
    const results = await getAiJobListingSearchResults(data);

    if (results.error) {
      toast.error(results.message);
      return;
    }

    const params = new URLSearchParams();

    results.jobIds.forEach((jobId) => {
      params.append('jobIds', jobId);
    });

    router.push(`/?${params.toString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="query"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Query</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-32" />
              </FormControl>
              <FormDescription>
                Provide a description of your skills/experience as well as what you are looking for
                in a job. The more specific you are, the better the results will be.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={form.formState.isSubmitting} type="submit" className="w-full">
          <LoadingSwap isLoading={form.formState.isSubmitting}>Search</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
