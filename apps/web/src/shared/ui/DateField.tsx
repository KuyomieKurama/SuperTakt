import { useId } from "react";
import { DatePicker, parseDate } from '@ark-ui/react/date-picker';
import { Portal } from '@ark-ui/react/portal';
import { Icon } from './Icon';
import { TimeField } from './TimeField';

/** Calendar-day values stay YYYY-MM-DD; the visible field follows German locale. */
export function DateField({ label, value, onChange, hint, wide = false, time }: {
  readonly label: string;
  readonly time?: { readonly value: string; readonly onChange: (value: string) => void };
  readonly hint?: string;
  readonly wide?: boolean;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const hintId = useId();
  return <DatePicker.Root className={`field date-field${wide ? " date-field--wide" : ""}`} locale="de-DE" startOfWeek={1}
    value={value ? [parseDate(value)] : []}
    onValueChange={details => onChange(details.value[0]?.toString() ?? '')}
    positioning={{ placement: 'bottom-start', strategy: 'fixed', gutter: 6 }}
    translations={{ content: `${label}: Datum wählen`, trigger: open => open ? 'Kalender schließen' : `${label}: Kalender öffnen`,
      prevTrigger: () => 'Vorheriger Monat', nextTrigger: () => 'Nächster Monat', clearTrigger: 'Datum löschen' }}>
    <DatePicker.Label className="field__label">{label}</DatePicker.Label>
    <DatePicker.Control className={`date-field__control${time ? " date-field__control--with-time" : ""}`}>
      <DatePicker.Context>{api =>
        <DatePicker.Input aria-describedby={hint ? hintId : undefined}
          className="field__input" placeholder="TT.MM.JJJJ" onClick={() => api.setOpen(true)} />
      }</DatePicker.Context>
      {time ? <TimeField label={`${label}: Uhrzeit`} value={time.value}
        onChange={time.onChange} disabled={!value} /> : null}
      <DatePicker.Trigger className="date-field__trigger"><Icon name="calendar" size={16} /></DatePicker.Trigger>
    </DatePicker.Control>
    {hint ? <p className="field__hint" id={hintId}>{hint}</p> : null}
    <Portal><DatePicker.Positioner className="popover-layer date-field__positioner">
      <DatePicker.Content className="date-field__calendar">
        <DatePicker.View view="day">
          <DatePicker.Context>{api => <>
            <DatePicker.ViewControl className="date-field__navigation">
              <DatePicker.PrevTrigger><span className="date-field__previous"><Icon name="chevron-right" size={16} /></span></DatePicker.PrevTrigger>
              <DatePicker.RangeText />
              <DatePicker.NextTrigger><Icon name="chevron-right" size={16} /></DatePicker.NextTrigger>
            </DatePicker.ViewControl>
            <DatePicker.Table>
              <DatePicker.TableHead><DatePicker.TableRow>
                {api.weekDays.map((day, index) => <DatePicker.TableHeader key={index}>{day.short}</DatePicker.TableHeader>)}
              </DatePicker.TableRow></DatePicker.TableHead>
              <DatePicker.TableBody>{api.weeks.map((week, index) => <DatePicker.TableRow key={index}>
                {week.map(day => <DatePicker.TableCell key={day.toString()} value={day}>
                  <DatePicker.TableCellTrigger>{day.day}</DatePicker.TableCellTrigger>
                </DatePicker.TableCell>)}
              </DatePicker.TableRow>)}</DatePicker.TableBody>
            </DatePicker.Table>
          </>}</DatePicker.Context>
        </DatePicker.View>
        <DatePicker.ClearTrigger className="date-field__clear">Datum löschen</DatePicker.ClearTrigger>
      </DatePicker.Content>
    </DatePicker.Positioner></Portal>
  </DatePicker.Root>;
}
