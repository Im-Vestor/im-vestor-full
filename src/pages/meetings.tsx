import {
  CalendarIcon,
  CircleUserRound
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";

export default function Meetings() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12 flex gap-6">
        <div className="w-2/5 rounded-xl border-2 border-white/10 bg-card p-12">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-[#EFD687] p-4">
              <CalendarIcon className="h-8 w-8 text-black" />
            </div>
            <div className="flex flex-col">
              <p className="mt-2 text-lg font-medium">Today</p>
              <p className="text-sm text-white/50">
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                })}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date ?? new Date())}
              captionLayout="buttons"
              showOutsideDays
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full",
                caption:
                  "flex flex-row justify-center pt-1 relative items-center space-x-2 mb-4",
                caption_between: "flex flex-row justify-center gap-1",
                nav: "space-x-1 flex items-center text-white",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full justify-between",
                head_cell:
                  "text-white/50 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2 justify-between",
                cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md",
                day_selected:
                  "bg-[#EFD687] text-black hover:bg-[#EFD687] hover:text-black focus:bg-[#EFD687] focus:text-black",
                day_today: "bg-white/5 text-white",
                day_outside: "text-white/30 opacity-50",
                day_disabled: "text-white/30",
                day_hidden: "invisible",
              }}
              className="p-3"
            />
          </div>
        </div>
        <div className="w-3/5 rounded-xl border-2 border-white/10 bg-card p-12">
          <div className="mt-4 flex flex-col gap-4">
            <MeetingCard />
            <MeetingCard />
            <MeetingCard />
          </div>
        </div>
      </div>
    </main>
  );
}

function MeetingCard() {
  return (
    <div className="rounded-xl border-2 border-white/10 bg-[#1E202A] p-6">
      <p className="text-sm text-white/50">
        Starts at: <span className="text-white">4:30 PM, 02 March 2024</span>
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Image
          src="https://cloudfront-us-east-1.images.arcpublishing.com/estadao/PQS5HFKS3FNJTHE7HUDVWTHDIU.jpg"
          alt="Company Logo"
          width={72}
          height={72}
          className="h-12 w-12 rounded-md object-cover"
        />
        <div className="flex flex-col">
          <p className="text-sm font-medium text-white">Airbnb</p>
          <p className="text-sm text-white/50">San Francisco, CA, USA</p>
        </div>
      </div>

      <hr className="my-4 border-white/10" />
      <div className="flex items-center justify-between">
        <div className="flex items-center -space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <CircleUserRound key={i} color="#EFD687" className="h-4 w-4" />
          ))}
        </div>
        <div className="ml-auto flex space-x-2">
          <Button variant="outline" className="h-8">
            Cancel Meeting
          </Button>
          <Button className="h-8">View Company</Button>
        </div>
      </div>
    </div>
  );
}
