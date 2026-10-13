import { useDeleteTag } from "@/api/generated";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

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
    const deleteTagMutation = useDeleteTag();

    const deleteTag = async () => {
        await deleteTagMutation.mutateAsync({ tagUuid: props.tag_uuid });
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
                    <Button variant="secondary" onClick={() => props.onClose()}>
                        {tg("button.close")}
                    </Button>
                    <Button variant="destructive" onClick={async () => await deleteTag()}>
                        {t("button.delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
