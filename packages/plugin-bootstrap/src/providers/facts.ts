import { embed } from "@ai16z/eliza/src/embedding.ts";
import { MemoryManager } from "@ai16z/eliza/src/memory.ts";
import { formatMessages } from "@ai16z/eliza/src/messages.ts";
import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { formatFacts } from "../evaluators/fact.ts";

const factsProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        const recentMessagesData = state?.recentMessagesData?.slice(-10);

        const recentMessages = formatMessages({
            messages: recentMessagesData,
            actors: state?.actorsData,
        });

        const embedding = await embed(runtime, recentMessages);

        const memoryManager = new MemoryManager({
            runtime,
            tableName: "facts",
        });

        const relevantFacts = [];
        //  await memoryManager.searchMemoriesByEmbedding(
        //     embedding,
        //     {
        //         roomId: message.roomId,
        //         count: 10,
        //         agentId: runtime.agentId,
        //     }
        // );

        const recentFactsData = await memoryManager.getMemories({
            roomId: message.roomId,
            count: 10,
            agentId: runtime.agentId,
        });

        // join the two and deduplicate
        const allFacts = [...relevantFacts, ...recentFactsData].filter(
            (fact, index, self) =>
                index === self.findIndex((t) => t.id === fact.id)
        );

        const formattedFacts = formatFacts(allFacts);

        return "Key facts that {{agentName}} knows:\n{{formattedFacts}}"
            .replace("{{agentName}}", runtime.character.name)
            .replace("{{formattedFacts}}", formattedFacts);
    },
};

export { factsProvider };
