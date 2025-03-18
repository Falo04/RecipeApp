import { Units } from '@/api/model/ingredients.interface';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import TAGS_CONTEXT from '@/context/tags';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { MinusIcon, PlusIcon } from 'lucide-react';
import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

/**
  * The properties for {@link CreateRecipe}
  */
export type CreateRecipeProps = {};

/**
  * The CreateRecipe
  */
function CreateRecipe(props: CreateRecipeProps) {
  const [t] = useTranslation("recipe");
  const [tg] = useTranslation();

  const tagContext = React.useContext(TAGS_CONTEXT);

  const formSchema = z.object({
    name: z.string().max(255, "Name cant be longer than 255 character"),
    description: z.string().max(255, "cant be longer that 255 character"),
    ingredients: z.array(z.object({
      name: z.string(),
      unit: z.nativeEnum(Units),
      amount: z.number()
    })).nonempty(),
    steps: z.array(z.object({
      step: z.string(),
    })),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      ingredients: [{
        name: "",
        amount: 0,
        unit: Units.Teaspoon,
      }],
      steps: [{ step: "" }],
    },
    mode: 'onChange'
  });

  const ingreFieldArray = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const stepFieldArray = useFieldArray({
    control: form.control,
    name: "steps",
  });

  function onSubmit(values: z.infer<typeof formSchema>) {

  }

  return (
    <div className='flex-grow'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='h-full flex flex-col md:grid md:grid-cols-2 gap-5'>
          <div className='h-full'>
            <div className='flex flex-col gap-3 pb-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>name</FormLabel>
                    <FormControl>
                      <Input placeholder='name' type='text' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>description</FormLabel>
                    <FormControl>
                      <Textarea placeholder='description' className='resize-none h-[100px]' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex justify-between'>
              <h2>{t("table.ingredients-title")}</h2>
              <Button className='' onClick={() => ingreFieldArray.append({ name: "", amount: 0, unit: Units.Kilogram })}><PlusIcon /></Button>
            </div>
            <ScrollArea className='h-[500px] relative'>
              <Table className='relative'>
                <TableHeader className='sticky top-0'>
                  <TableRow>
                    <TableHead>{t("table.ingredients-name")}</TableHead>
                    <TableHead>{t("table.ingredients-description")}</TableHead>
                    <TableHead className="min-w-[140px]">{t("table.ingredients-unit")}</TableHead> {/* Ensures consistent width */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingreFieldArray.fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder='name' type='text'  {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder='amount' type='text'  {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="min-w-[140px]"> {/* Ensures unit column stays wide */}
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className='w-full'>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(Units).map(unit => (
                                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => ingreFieldArray.remove(index)}><MinusIcon /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

          </div>
          <div className='flex flex-col gap-4'>
            <div className='flex justify-between'>
              <h2>{t("label.step-title")}</h2>
              <Button className='' onClick={() => stepFieldArray.append({ step: "" })}><PlusIcon /></Button>
            </div>

            {stepFieldArray.fields.map((item, index) => (
              <div className='relative'>
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`steps.${index}.step`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tg("label-steps") + index}</FormLabel>
                      <FormControl>
                        <Textarea placeholder='step' className='resize-none h-[100px]' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className='absolute top-6 right-1' variant="ghost" onClick={() => stepFieldArray.remove(index)}><MinusIcon /></Button>
              </div>
            ))}
          </div>
          <Button className='place-self-end col-start-2' variant="primary" type="submit">Submit</Button>
        </form>
      </Form>
    </div >
  );
}

export const Route = createFileRoute('/_app/app/recipes/create')({
  component: CreateRecipe,
})

