import { Api } from '@/api/api';
import { TagColors, type CreateOrUpdateTag } from '@/api/model/tag.interface';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import React from 'react';
import TAGS_CONTEXT from '@/context/tags';


/**
  * The properties for {@link CreateTagDialog}
  */
export type CreateTagDialogProps = {
  onClose: () => void;
};

/**
  * The CreateTagDialog
  */
export function CreateTagDialog(props: CreateTagDialogProps) {
  const [t] = useTranslation("tag");
  const [tg] = useTranslation();
  const tagContext = React.useContext(TAGS_CONTEXT);

  const zodEnumColors = z.enum(Object.values(TagColors) as [string, ...string[]]);

  const formSchema = z.object({
    name: z.string(),
    color: zodEnumColors,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "blue",
    }
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload: CreateOrUpdateTag = {
      name: values.name,
      color: values.color as TagColors,
    }


    toast.promise(
      Api.tags.create(payload),
      {
        loading: 'Creating...',
        success: (result) => {
          if (result.error) {
            toast.error(result.error.message);
            return;
          }

          if (result.data) {
            tagContext.reset();
            props.onClose();
            return "Created successfully";
          }
        },
        error: () => {
          return "Something failed";
        },
      }
    );
  }

  return (
    <Dialog open={true} onOpenChange={props.onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("dialog.create-title")}</DialogTitle>
          <DialogDescription>
            {t("dialog.create-description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tg("label.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tg("label.color")}</FormLabel>
                  <Select {...field} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger id={"create-tag"} className="w-full">
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {zodEnumColors.options.map((color) => (
                        <SelectItem key={`create-tag_${color}`} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <div className='w-full flex justify-between'>
                <Button variant="secondary" onClick={() => props.onClose()}> {tg("button.close")} </Button>
                <Button type="submit">{t("button.create")}</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

