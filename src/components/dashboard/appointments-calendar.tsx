"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { appointments } from "@/lib/placeholder-data"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function AppointmentsCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const badgeVariant = {
    Confirmado: "default",
    Pendiente: "secondary",
  } as const

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-0 [&_td]:w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-around",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] justify-center flex",
                row: "flex w-full mt-2 justify-around",
                cell: "h-14 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn("h-14 w-full p-0 font-normal aria-selected:opacity-100"),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>
              Appointments for {date ? date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Today'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                       <p className="font-semibold text-sm">{apt.time}</p>
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{apt.client}</p>
                      <p className="text-sm text-muted-foreground">{apt.service}</p>
                    </div>
                    <Badge variant={badgeVariant[apt.status as keyof typeof badgeVariant] || "outline"}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No appointments for this day.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
