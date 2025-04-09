import { PreferredHoursPeriod } from '@prisma/client';
import { ArrowLeft, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { api } from '~/utils/api';

const morningHours = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00'];
const afternoonHours = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const eveningHours = ['19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];

export default function PreferredHours() {
  const router = useRouter();
  const utils = api.useUtils(); 
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<PreferredHoursPeriod | ''>('');

  const { data: preferredHours, isLoading } = api.preferredHours.getPreferredHours.useQuery();

  const createPreferredHoursMutation = api.preferredHours.createPreferredHours.useMutation({
    onSuccess: () => {
      toast.success('Preferred hour added successfully');
      void utils.preferredHours.getPreferredHours.invalidate();
      setSelectedTime('');
      setSelectedPeriod('');
    },
    onError: error => {
      toast.error(error.message);
    },
  });
  const deletePreferredHoursMutation = api.preferredHours.deletePreferredHours.useMutation({
    onSuccess: () => {
      toast.success('Preferred hour deleted successfully');
      void utils.preferredHours.getPreferredHours.invalidate();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleAddPreferredHour = () => {
    if (!selectedTime || !selectedPeriod) {
      toast.error('Please select both time and period');
      return;
    }

    const existingHourForPeriod = preferredHours?.find(hour => hour.period === selectedPeriod);

    if (existingHourForPeriod) {
      toast.error(`You already have a preferred hour for ${selectedPeriod.toLowerCase()}`);
      return;
    }

    createPreferredHoursMutation.mutate({
      time: selectedTime,
      period: selectedPeriod,
    });
  };

  const handleDeletePreferredHour = (id: string) => {
    deletePreferredHoursMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12 flex gap-6">
        <div className="w-full rounded-xl border-2 border-white/10 bg-card p-12">
          <button
            type="button"
            className="mb-4 flex items-center gap-2 hover:opacity-75 sm:mb-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="mt-4 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Preferred Hours</h1>
            <p className="text-sm text-white/50">
              Set your preferred hours for meetings with investors
            </p>

            <div className="mt-8 flex flex-col gap-8">
              {/* Add new preferred hour */}
              <div className="flex items-end gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Period</label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={value => setSelectedPeriod(value as PreferredHoursPeriod)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PreferredHoursPeriod).map(period => (
                        <SelectItem key={period} value={period}>
                          {period.charAt(0) + period.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Time (UTC)</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPeriod === PreferredHoursPeriod.MORNING &&
                        morningHours.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      {selectedPeriod === PreferredHoursPeriod.AFTERNOON &&
                        afternoonHours.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      {selectedPeriod === PreferredHoursPeriod.EVENING &&
                        eveningHours.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAddPreferredHour}
                  disabled={
                    !selectedTime ||
                    !selectedPeriod ||
                    isLoading ||
                    createPreferredHoursMutation.isPending
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Preferred Hour
                </Button>
              </div>

              {/* List of preferred hours */}
              <div className="flex flex-col gap-4">
                {preferredHours?.map(hour => (
                  <div
                    key={hour.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-white/5 p-2">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {hour.period.charAt(0) + hour.period.slice(1).toLowerCase()}
                        </p>
                        <p className="text-sm text-white/50">{hour.time}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePreferredHour(hour.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {preferredHours?.length === 0 && (
                  <p className="text-center text-sm text-white/50">No preferred hours set yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
