import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { Form, Input } from "@/components/ui/form";
import { Field, FieldGroup, FieldSet } from "@/components/ui/field.tsx";

/**
 * The properties for {@link FilterBar}
 */
export type FilterBarProps = {
    /** The current search text, typically from a `search` URL search param */
    search: string;
    /** Called with the new search text, debounced by 500ms */
    onChange: (search: string) => void | Promise<void>;
    /** Placeholder of the search input */
    placeholder?: string;
    /** Additional controls shown on the right side, e.g. a view menu */
    children?: React.ReactNode;
};

/**
 * A bar with a debounced search input and optional controls on the right
 */
export function FilterBar(props: FilterBarProps) {
    const form = useForm({
        defaultValues: {
            search: props.search,
        },
    });

    return (
        <div className={"flex items-start justify-between gap-4 lg:items-end"}>
            <Form onSubmit={form.handleSubmit}>
                <FieldGroup>
                    <FieldSet>
                        <form.Field
                            name={"search"}
                            validators={{
                                onChangeAsync: async ({ fieldApi }) => {
                                    await props.onChange(fieldApi.state.value);
                                },
                                onChangeAsyncDebounceMs: 500,
                            }}
                        >
                            {(fieldApi) => (
                                <Field>
                                    <Input
                                        value={fieldApi.state.value}
                                        onChange={(e) => fieldApi.handleChange(e.target.value)}
                                        placeholder={props.placeholder}
                                        className={"w-44 lg:w-72"}
                                    />
                                </Field>
                            )}
                        </form.Field>
                    </FieldSet>
                </FieldGroup>
            </Form>

            {props.children}
        </div>
    );
}
