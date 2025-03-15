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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import React from 'react';
import TAGS_CONTEXT from '@/context/tags';
import { useForm } from 'react-hook-form';

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

  const formSchema = z.object({
    name: z.string().max(255, "Name cant be longer than 255 character"),
    color: z.nativeEnum(TagColors, { message: "Invalid Color type" }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: TagColors.Blue,
    },
    mode: "onChange",
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload: CreateOrUpdateTag = {
      name: values.name,
      color: values.color,
    }

    toast.promise(
      Api.tags.create(payload),
      {
        loading: tg("toast.loading"),
        success: (result) => {
          if (result.error) {
            toast.error(result.error.message);
            return;
          }

          if (result.data) {
            tagContext.reset();
            props.onClose();
            return tg("toast.created-success");
          }
        },
        error: () => {
          return tg("toast.general-error");
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
                  <FormMessage />
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
                      {(Object.keys(TagColors)).map((color) => (
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

