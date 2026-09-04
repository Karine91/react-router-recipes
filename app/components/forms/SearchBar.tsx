import { useSearchParams, useNavigation, Form } from "react-router";
import clsx from "clsx";
import { SearchIcon } from "~/components/icons/Search";

type SearchBarProps = {
  placeholder: string;
  className?: string;
};

export default function SearchBar({ placeholder, className }: SearchBarProps) {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const isSearching = navigation.formData?.has("q");
  return (
    <Form
      className={clsx(
        "flex border-2 border-gray-300 rounded-md",
        "focus-within:border-primary ",
        isSearching && "animate-pulse",
        className,
      )}
    >
      <button type="submit" className="px-2 mr-1">
        <SearchIcon />
      </button>
      <input
        type="text"
        name="q"
        defaultValue={searchParams.get("q") || ""}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full py-3 px-2 outline-none rounded-md"
      />
    </Form>
  );
}
