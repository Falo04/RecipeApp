import { Api } from "@/api/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Field } from "@/components/ui/field.tsx";

/**
 * The properties for {@link DeleteTagDialog}
 */
export type DeleteTagDialogProps = {
    /** Simple Tag */
    tag_uuid: string;
    /** On close */
    onClose: () => void;
};

/**
 * Dialog to delete a tag
 */
export function DeleteTagDialog(props: DeleteTagDialogProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const deleteTag = async () => {
        await Api.tags.delete(props.tag_uuid);
        toast.success(t("toast.deleted-success"));
        props.onClose();
        return;
    };

    return (
        <Dialog open={true} onOpenChange={props.onClose}>
            <DialogContent>
                <DialogHeader className="items-start">
                    <DialogTitle>{t("dialog.delete-title")} </DialogTitle>
                    <DialogDescription className="flex w-full flex-col items-start gap-2">
                        {t("dialog.delete-description")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Field orientation={"horizontal"}>
                        <Button variant="secondary" onClick={() => props.onClose()}>
                            {tg("button.close")}
                        </Button>
                        <Button variant="destructive" onClick={async () => await deleteTag()}>
                            {t("button.delete")}
                        </Button>
                    </Field>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
