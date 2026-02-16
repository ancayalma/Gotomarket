
import React from "react";
import Container from "../components/ui/Container";
import ListsView from "./components/ListsView";

const ListsPage = () => {
    return (
        <Container title="Lists" description="Manage your lead lists">
            <ListsView />
        </Container>
    );
};

export default ListsPage;
