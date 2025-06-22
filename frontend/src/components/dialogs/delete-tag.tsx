import { Api } from "@/api/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import type { SimpleTag } from "@/api/model/tag.interface";

/**
 * The properties for {@link DeleteTagDialog}
 */
export type DeleteTagDialogProps = {
    tag: SimpleTag;
    onDeletion: () => void;
    onClose: () => void;
};

/**
 * The DeleteTagDialog
 */
export function DeleteTagDialog(props: DeleteTagDialogProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const deleteTag = async () => {
        toast.promise(Api.tags.delete(props.tag.uuid), {
            loading: tg("toast.loading"),
            success: (result) => {
                if (result.error) {
                    toast.error(result.error.message);
                    return;
                }

                props.onDeletion();
                return t("toast.deleted-success");
            },
            error: tg("toast.general-error"),
        });
    };

    return (
        <Dialog open={true} onOpenChange={props.onClose}>
            <DialogContent size={"sm"}>
                <DialogHeader className="items-start">
                    <DialogTitle>{t("dialog.delete-title")} </DialogTitle>
                    <DialogDescription className="flex w-full flex-col items-start gap-2">
                        {t("dialog.delete-description")}
                        <span className="ml-1 max-w-[200px] truncate text-2xl" title={props.tag.name}>
                            {props.tag.name}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <div className="flex w-full justify-between">
                        <Button variant="secondary" onClick={() => props.onClose()}>
                            {tg("button.close")}
                        </Button>
                        <Button variant="destructive" onClick={async () => await deleteTag()}>
                            {t("button.delete")}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
