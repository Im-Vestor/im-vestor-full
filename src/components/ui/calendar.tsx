'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DropdownProps } from 'react-day-picker';
import { cn } from '~/lib/utils';
import { buttonVariants } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { ScrollArea } from './scroll-area';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = false, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'rounded-md border-none bg-[#1C2029] p-3 placeholder:font-normal placeholder:text-[#E5E7EA]',
        className
      )}
      classNames={{
        head: 'flex flex-row justify-between',

        months: 'flex flex-col sm:flex-row space-y-4 text-white  sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex flex-row justify-center pt-1 relative items-center space-x-2',
        caption_dropdowns: 'flex flex-row justify-center gap-1',
        caption_between: 'flex flex-row justify-center gap-1',
        caption_label: 'hidden',
        dropdown: 'flex flex-row justify-center gap-1 focus:ring-0 select-none',
        nav: 'space-x-1 flex items-center text-white',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex w-full',
        head_cell: 'text-neutral-400 rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-800/50 [&:has([aria-selected])]:bg-neutral-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-neutral-50 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900 focus:bg-neutral-50 focus:text-neutral-900',
        day_today: 'bg-neutral-800 text-neutral-50',
        day_outside:
          'day-outside text-neutral-400 aria-selected:bg-neutral-800/50 aria-selected:text-neutral-400',
        day_disabled: 'text-neutral-400 opacity-50',
        day_range_middle: 'aria-selected:bg-neutral-800 aria-selected:text-neutral-50',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Dropdown: ({ value, onChange, children }: DropdownProps) => {
          const options = React.Children.toArray(children) as React.ReactElement<
            React.HTMLProps<HTMLOptionElement>
          >[];
          const selected = options.find(child => child.props.value === value);
          const handleChange = (value: string) => {
            const changeEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange?.(changeEvent);
          };
          return (
            <Select
              value={value?.toString()}
              onValueChange={value => {
                handleChange(value);
              }}
            >
              <SelectTrigger className="pr-1.5 focus:ring-0">
                <SelectValue>{selected?.props?.children}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                <ScrollArea className="h-80">
                  {options.map((option, id: number) => (
                    <SelectItem
                      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      key={`${option.props.value}-${id}`}
                      value={option.props.value?.toString() ?? ''}
                    >
                      {option.props.children}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          );
        },
        IconLeft: ({}) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({}) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
